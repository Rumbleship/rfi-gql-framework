"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = exports.QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = exports.QSR_GQL_FRAGMENT = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = void 0;
const os_1 = require("os");
const queued_subscription_1 = require("./queued-subscription");
const queued_gql_request_client_1 = require("../../clients/queued-gql-request-client");
const shared_1 = require("../../shared");
const pubsub_1 = require("@google-cloud/pubsub");
// eslint-disable-next-line import/no-cycle
const queued_subscription_cache_1 = require("../../queued-subscription-cache");
const init_sequelize_1 = require("../../../app/server/init-sequelize");
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = 'QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC';
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

  }
`;
/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 */
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = `
    subscription {
      onQueuedSubscriptionRequestChange (  watch_list: [active]) {
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
        this.in_memory_cache_consistency_id = 0;
        this.qsrChangeObserver = new shared_1.RfiPubSubSubscription(this.config, new pubsub_1.PubSub(this.config.Gcp.Auth), exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC, `${exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}_${os_1.hostname()}` // Every instance needs to update its cache.
        );
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
                await this.process_incoming_qsr(ctx, [changedQueuedRequest]);
            }
        });
        return;
    }
    async process_incoming_qsr(ctx, incomingQsrs) {
        const sequelize = init_sequelize_1.getSequelizeInstance();
        if (sequelize) {
            const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
            try {
                const qsrCache = await queued_subscription_cache_1.loadCache({ transaction });
                // Has anotehr instance already saved a later version of the cache?
                if (this.in_memory_cache_consistency_id < qsrCache.highest_cache_consistency_id) {
                    try {
                        this.in_memory_cache_consistency_id = await this.refreshSubscriptionsFromCache(qsrCache);
                    }
                    catch (error) {
                        // cache is out of sync or corrupt, reset it
                        qsrCache.clear();
                    }
                }
                for (const incomingQsr of incomingQsrs) {
                    // todo Add service list to the qsr which is set by the qsr management service
                    // and only process if we are on the list
                    if (incomingQsr && incomingQsr.id) {
                        if (incomingQsr.cache_consistency_id) {
                            const key = incomingQsr.id.toString();
                            const foundSubscription = this.getSubscription(key);
                            if (foundSubscription &&
                                foundSubscription.cache_consistency_id &&
                                incomingQsr.cache_consistency_id &&
                                foundSubscription.cache_consistency_id < incomingQsr.cache_consistency_id) {
                                try {
                                    // only process if it is valid fro this service
                                    queued_subscription_1.QueuedSubscription.validateSubscriptionRequest(this.schema, incomingQsr);
                                    await this.removeSubscription(key);
                                    if (incomingQsr.active) {
                                        this.addSubscriptionAndStart(key, incomingQsr);
                                    }
                                }
                                catch (error) {
                                    // swollow the error
                                    // TODO determine the type of error and swollow or spit it out
                                    ctx.logger.log(`Couldnt process qsr: ${incomingQsr.id} in ${this.config.serviceName}. Error: ${error.toString()}`);
                                }
                            }
                            else {
                                if (!foundSubscription && incomingQsr.active) {
                                    // then must be a new one and we must add it
                                    this.addSubscriptionAndStart(key, incomingQsr);
                                }
                            }
                            if (this.in_memory_cache_consistency_id < incomingQsr.cache_consistency_id) {
                                this.in_memory_cache_consistency_id = incomingQsr.cache_consistency_id;
                            }
                        }
                    }
                }
                // update the cache...
                qsrCache.clear();
                qsrCache.add(Array.from(this.queuedSubscriptions.values()));
                qsrCache.highest_cache_consistency_id = this.in_memory_cache_consistency_id;
                await queued_subscription_cache_1.saveCache(qsrCache, { transaction });
                await transaction.commit();
            }
            catch (seqError) {
                // TODO what should be logged?
                ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
                await transaction.rollback();
            }
        }
    }
    async refreshSubscriptionsFromCache(qsrCache) {
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
        const qsrCache = await queued_subscription_cache_1.loadCache();
        await this.refreshSubscriptionsFromCache(qsrCache);
        // start listening for changes...
        await this.initializeQsrChangeObserver();
        this.queuedGqlRequestClient.onResponse({
            client_request_id: 'GetAllQueuedSubscriptionRequests',
            handler: async (response, ctx) => {
                // We can get a response from multiple services, and google pub sub can
                // deliver it twice.
                if (response.response.data) {
                    const qsrs = response.response.data['queuedSubscriptionRequests'].edges.map(entry => entry.node);
                    await this.process_incoming_qsr(ctx, qsrs);
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
    async stop() {
        await this.qsrChangeObserver.stop();
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
        // const schemaAsSdl = printSchema(this.schema);
        await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id: `${this.config.serviceName}_updateServiceSchema`,
            respond_on_error: false,
            gql_query_string: `
      `
        });
    }
}
exports.QueuedSubscriptionServer = QueuedSubscriptionServer;
//# sourceMappingURL=queued-subscription-server.js.map