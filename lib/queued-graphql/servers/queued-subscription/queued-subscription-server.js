"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = exports.QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = exports.QSR_GQL_FRAGMENT = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = void 0;
const graphql_1 = require("graphql");
const os_1 = require("os");
const queued_subscription_1 = require("./queued-subscription");
const queued_gql_request_client_1 = require("../../clients/queued-gql-request-client");
const shared_1 = require("../../shared");
const pubsub_1 = require("@google-cloud/pubsub");
const crypto_1 = require("crypto");
// eslint-disable-next-line import/no-cycle
const queued_subscription_cache_1 = require("../../queued-subscription-cache");
const init_sequelize_1 = require("../../../app/server/init-sequelize");
const relay_1 = require("../../../gql/relay");
const oid_1 = require("@rumbleship/oid");
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = `QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC`;
exports.QSR_GQL_FRAGMENT = `
  fragment qsr on QueuedSubscriptionRequest {
    id
    cache_consistency_id
    marshalled_acl
    gql_query_string
    active
    owner_id
    operation_name
    query_attributes
    publish_to_topic_name
    serviced_by
    deleted_at
  }
`;
/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 * TODO: Should we also watch for deleted_at changes and turn paranoid on in the repository?
 *
 *
 */
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = `
    subscription {
      onQueuedSubscriptionRequestChange {
        idempotency_key
        node {
          ... qsr
        }
      }
    }
    ${exports.QSR_GQL_FRAGMENT}
    `;
exports.QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL = `query qsrs {
      queuedSubscriptionRequests(order_by:{ keys: [["cache_consistency_id","ASC"]]}, first: 100 ) {
        edges {
          node {
            ... qsr
          }
        }
      }
    }
    ${exports.QSR_GQL_FRAGMENT}
    `;
class QueuedSubscriptionServer {
    constructor(config, schema) {
        this.config = config;
        this.schema = schema;
        this.queuedSubscriptions = new Map();
        const qsrChangeTopic = `${this.config.PubSub.topicPrefix}_${exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}`;
        const qsrChangeSubsciptionName = `${exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}`; // Only one instance of the service slistens to this...
        const qsrCacheChangeTopicName = `${this.config.PubSub.topicPrefix}_${relay_1.NODE_CHANGE_NOTIFICATION}_${queued_subscription_cache_1.QsrCacheOidScope}`;
        const qsrCacheChangeSubscriptionName = `${this.config.PubSub.topicPrefix}_${relay_1.NODE_CHANGE_NOTIFICATION}_${queued_subscription_cache_1.QsrCacheOidScope}_${os_1.hostname()}`; // Each instance recieves this
        const pubsub = new pubsub_1.PubSub(this.config.Gcp.Auth);
        this.qsrChangeObserver = new shared_1.RfiPubSubSubscription(this.config, pubsub, qsrChangeTopic, qsrChangeSubsciptionName);
        this.qsrLocalCacheObserver = new shared_1.RfiPubSubSubscription(this.config, pubsub, qsrCacheChangeTopicName, qsrCacheChangeSubscriptionName);
        this.queuedGqlRequestClient = new queued_gql_request_client_1.QueuedGqlRequestClientOneInstanceResponder(config);
    }
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    async initializeQsrChangeObserver() {
        await this.qsrChangeObserver.init();
        // kick off on its own promise chain
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.qsrChangeObserver.start(async (response, ctx) => {
            var _a, _b;
            const changedQueuedRequest = (_b = (_a = response.subscription_response.data) === null || _a === void 0 ? void 0 : _a[`onQueuedSubscriptionRequestChange`]) === null || _b === void 0 ? void 0 : _b.node;
            if (changedQueuedRequest) {
                // All we do is add it to the cache... the cache will update, and the localCacheObserver will force the update to live subscriptions
                //
                await this.process_incoming_qsrs(ctx, [changedQueuedRequest]);
            }
        });
        return;
    }
    async process_incoming_qsrs(ctx, incomingQsrs) {
        var _a, _b;
        const sequelize = init_sequelize_1.getSequelizeInstance();
        if (sequelize) {
            const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
            try {
                const qsrCache = await queued_subscription_cache_1.loadCache(this.config.Gcp.gaeVersion, { transaction });
                let cache_dirty = false;
                const validateAndAddToCache = (request) => {
                    try {
                        queued_subscription_1.QueuedSubscription.validateSubscriptionRequest(this.schema, request);
                        qsrCache.add([request]);
                        cache_dirty = true;
                    }
                    catch (error) {
                        // swollow the error
                        // TODO Honeycomb determine the type of error and swollow or spit it out
                        ctx.logger.log(`Couldnt process qsr: ${request.id} in ${this.config.serviceName}. Error: ${error.toString()}`);
                    }
                };
                for (const incomingQsr of incomingQsrs) {
                    // and only process if we are on the list
                    if (incomingQsr && ((_a = incomingQsr.serviced_by) === null || _a === void 0 ? void 0 : _a.includes(this.config.serviceName)) &&
                        incomingQsr.id &&
                        incomingQsr.cache_consistency_id) {
                        const key = incomingQsr.id.toString();
                        const cachedQsr = qsrCache.cache.get(key);
                        if (cachedQsr) {
                            if (incomingQsr.deleted_at) {
                                qsrCache.cache.delete(key);
                            }
                            else {
                                if ((_b = cachedQsr.cache_consistency_id) !== null && _b !== void 0 ? _b : 0 < incomingQsr.cache_consistency_id) {
                                    validateAndAddToCache(incomingQsr);
                                } // else ignore
                            }
                        }
                        else {
                            validateAndAddToCache(incomingQsr);
                        }
                    }
                }
                if (cache_dirty) {
                    await queued_subscription_cache_1.saveCache(qsrCache, { transaction });
                }
                await transaction.commit();
            }
            catch (seqError) {
                // TODO what should be logged?
                ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
                await transaction.rollback();
            }
        }
    }
    /**
     * Utility to dump out current qsrs... usefull debug tool
     */
    logActiveQsrs(ctx) {
        ctx.logger.log(`Active Qsrs for ${this.config.serviceName}`);
        for (const [key, qsr] of this.queuedSubscriptions) {
            ctx.logger.log(`   ${key}: ${qsr.cache_consistency_id}`);
        }
    }
    async refreshSubscriptionsFromCache(qsrCache) {
        if (!qsrCache) {
            qsrCache = await queued_subscription_cache_1.loadCache(this.config.Gcp.gaeVersion);
        }
        // find active subscriptions that need to be removed
        for (const [key] of this.queuedSubscriptions.entries()) {
            if (!qsrCache.cache.has(key)) {
                await this.removeSubscription(key);
            }
        }
        // find qsr's that have to be added
        for (const [key, qsr] of qsrCache.cache.entries()) {
            if (!this.queuedSubscriptions.has(key)) {
                this.addSubscriptionAndStart(key, qsr);
            }
        }
        return qsrCache.highest_cache_consistency_id;
    }
    async start(ctx) {
        const qsrCache = await queued_subscription_cache_1.loadCache(this.config.Gcp.gaeVersion);
        await this.refreshSubscriptionsFromCache(qsrCache);
        await this.initializeCacheChangeObserver();
        // start listening for changes...
        await this.initializeQsrChangeObserver();
        await this.publishSchema(ctx);
        await this.initializeCacheRefreshRequest(ctx);
    }
    async stop() {
        await this.qsrChangeObserver.stop();
        await this.stopAndClearSubscriptions();
    }
    async stopAndClearSubscriptions() {
        await Promise.all(Array.from(this.queuedSubscriptions, async (queuedSubscription) => {
            return queuedSubscription[1].stop();
        }));
        this.queuedSubscriptions.clear();
    }
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscriptionAndStart(key, request) {
        if (this.queuedSubscriptions.has(key)) {
            throw new Error(`QueuedSubscription: id: ${key}, Name: ${request.subscription_name} already running`);
        }
        const queuedSubscription = new queued_subscription_1.QueuedSubscription(this.schema, request, this.config.Gcp);
        this.queuedSubscriptions.set(key, queuedSubscription);
        // start it asynchonously
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void queuedSubscription.start();
        return queuedSubscription;
    }
    async removeSubscription(key) {
        const queuedSubscription = this.queuedSubscriptions.get(key);
        if (queuedSubscription) {
            // remove from list first, as await can switch promise chains
            this.queuedSubscriptions.delete(key);
            await queuedSubscription.stop();
        }
    }
    hasSubscription(key) {
        return this.queuedSubscriptions.has(key);
    }
    getSubscription(key) {
        return this.queuedSubscriptions.get(key);
    }
    /**
     * Sends the schema and its hash to the QueuedSubscriptionManagement service so that QSR's
     * can be validated before being accepted.
     *
     * When a schema
     */
    async publishSchema(ctx) {
        const schemaAsSdl = graphql_1.printSchema(this.schema);
        const schema_hash = crypto_1.createHash('SHA256').update(schemaAsSdl).digest('base64');
        // Note we use a QueuedGqlRequest which calls the mutation on any services that supports this particular
        // mutaion name.
        // We don't care about the response
        this.queuedGqlRequestClient.onResponse({
            client_request_id: `${this.config.serviceName}_updateServiceSchema`,
            handler: async (response, ctx) => {
                ctx.logger.log(`received response to :${this.config.serviceName}_updateServiceSchema`);
            }
        });
        await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id: `${this.config.serviceName}_updateServiceSchema`,
            respond_on_error: true,
            gql_query_string: `mutation updateSchema( $service_name: String!, $schema: String!, $schema_hash: String!) {
        updateServiceSchema(input: {service_name: $service_name, schema: $schema, schema_hash: $schema_hash}) {
          id
        }
      }
      `,
            operation_name: 'updateSchema',
            query_attributes: JSON.stringify({
                service_name: this.config.serviceName,
                schema_hash,
                schema: schemaAsSdl
            })
        });
    }
    async initializeCacheRefreshRequest(ctx) {
        this.queuedGqlRequestClient.onResponse({
            client_request_id: 'GetAllQueuedSubscriptionRequests',
            handler: async (response, ctx) => {
                // We can get a response from multiple services, and google pub sub can
                // deliver it twice.
                if (response.response.data) {
                    const qsrs = response.response.data['queuedSubscriptionRequests'].edges.map(entry => entry.node);
                    if (qsrs.length) {
                        await this.process_incoming_qsrs(ctx, qsrs);
                    }
                    else {
                        // in development we might clear out the database and so we can get this situation where we have a cache but no
                        // real qsrs. This is a special case and we deliberately clear the cache at this and active running queuedSubsctiptions
                        // This may be better sorted through a flag in config, but fro now we do it this way
                        await this.stopAndClearSubscriptions();
                        await queued_subscription_cache_1.saveCache(new queued_subscription_cache_1.QueuedSubscriptionCache(this.config.Gcp.gaeVersion));
                    }
                }
                if (response.response.errors) {
                    ctx.logger.log(`Error in response: ${response.response.errors.toString()}`);
                }
            }
        });
        // we kick off a floating promise chain here...
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.queuedGqlRequestClient.start();
        // Add a local_cache model observer so that each instance can reload on change
        // now we make the request
        await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id: 'GetAllQueuedSubscriptionRequests',
            respond_on_error: true,
            gql_query_string: exports.QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL
        });
    }
    async initializeCacheChangeObserver() {
        // we listen directly to NODE_CHANGE_NOTIFICATIONS as the qsr_cache is not a full
        // Relay object
        // HOWEVER each service broadcasts on the channel so we filter out ones genrerated by this
        // service
        await this.qsrLocalCacheObserver.init();
        // kick off on its own promise chain
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.qsrLocalCacheObserver.start(async (response, ctx) => {
            // we are very careful on messagees passed in as they may not be what we think they are
            if (response.publisher_service_name === this.config.serviceName) {
                // double check...as messages might not be what we think they should be
                if (response.oid) {
                    const { scope } = new oid_1.Oid(response.oid).unwrap();
                    if (scope === queued_subscription_cache_1.QsrCacheOidScope) {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.refreshSubscriptionsFromCache();
                    }
                }
            }
        });
        return;
    }
}
exports.QueuedSubscriptionServer = QueuedSubscriptionServer;
//# sourceMappingURL=queued-subscription-server.js.map