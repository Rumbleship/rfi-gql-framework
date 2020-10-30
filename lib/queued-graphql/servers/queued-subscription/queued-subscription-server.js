"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = exports.QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = exports.QSR_GQL_FRAGMENT = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = void 0;
const graphql_1 = require("graphql");
const os_1 = require("os");
const rumbleship_context_1 = require("../../../app/rumbleship-context");
const queued_subscription_1 = require("./queued-subscription");
const queued_gql_request_client_1 = require("../../clients/gql-request/queued-gql-request-client");
const shared_1 = require("../../shared");
const pubsub_1 = require("@google-cloud/pubsub");
const crypto_1 = require("crypto");
// eslint-disable-next-line import/no-cycle
const queued_subscription_cache_1 = require("../../queued-subscription-cache");
const init_sequelize_1 = require("../../../app/server/init-sequelize");
const relay_1 = require("../../../gql/relay");
const oid_1 = require("@rumbleship/oid");
const o11y_1 = require("@rumbleship/o11y");
const pubsub_auth_project_1 = require("../../../helpers/pubsub-auth-project");
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = `QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC`;
exports.QSR_GQL_FRAGMENT = `
  fragment qsr on QueuedSubscriptionRequest {
    id
    subscription_name
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
        // functions to add tracing
        this.loadCache = (ctx, version, opts) => ctx.beeline.bindFunctionToTrace(() => ctx.beeline.withAsyncSpan({ name: 'loadCache', 'meta.type': 'QsrCache' }, async (_span) => {
            return queued_subscription_cache_1.loadCache(version, opts);
        }))();
        const qsrChangeTopic = `${this.config.PubSub.topicPrefix}_${exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}`;
        const qsrChangeSubsciptionName = `${this.config.PubSub.topicPrefix}_${exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}`; // Only one instance of the service slistens to this...
        const qsrCacheChangeTopicName = `${this.config.PubSub.topicPrefix}_${relay_1.NODE_CHANGE_NOTIFICATION}_${queued_subscription_cache_1.QsrCacheOidScope}`;
        const qsrCacheChangeSubscriptionName = `${this.config.PubSub.topicPrefix}_${relay_1.NODE_CHANGE_NOTIFICATION}_${queued_subscription_cache_1.QsrCacheOidScope}_${config.serviceName}.${config.Gcp.gaeVersion}.${os_1.hostname()}`; // Each instance recieves this
        const pubsub = new pubsub_1.PubSub(pubsub_auth_project_1.forcePublicProjectPubsub(this.config.Gcp.Auth));
        pubsub.projectId = pubsub.projectId.replace('-private', '-public');
        this.qsrChangeObserver = new shared_1.RfiPubSubSubscription(this.config, pubsub, qsrChangeTopic, qsrChangeSubsciptionName, false);
        this.qsrLocalCacheObserver = new shared_1.RfiPubSubSubscription(this.config, pubsub, qsrCacheChangeTopicName, qsrCacheChangeSubscriptionName, true // delete_on_stop
        );
        this.queuedGqlRequestClient = new queued_gql_request_client_1.QueuedGqlRequestClientSingleInstanceResponder(config);
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
        this.qsrChangeObserver.start(async (ctx, response) => {
            await this.handler_onQueuedSubscriptionRequestChange(ctx, response);
        });
        return;
    }
    async process_incoming_qsrs(ctx, incomingQsrs) {
        var _a;
        const sequelize = init_sequelize_1.getSequelizeInstance();
        if (sequelize) {
            const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
            try {
                const qsrCache = await this.loadCache(ctx, this.config.Gcp.gaeVersion, { transaction });
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
                        if (cachedQsr && cachedQsr.cache_consistency_id) {
                            if (incomingQsr.deleted_at) {
                                qsrCache.cache.delete(key);
                            }
                            else {
                                if (cachedQsr.cache_consistency_id < incomingQsr.cache_consistency_id) {
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
    async refreshSubscriptionsFromCache(ctx, qsrCache) {
        if (!qsrCache) {
            qsrCache = await queued_subscription_cache_1.loadCache(this.config.Gcp.gaeVersion);
        }
        // find active subscriptions that need to be removed
        for (const [key, queued] of this.queuedSubscriptions.entries()) {
            const cachedSubscription = qsrCache.cache.get(key);
            if (!cachedSubscription ||
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                queued.cache_consistency_id < cachedSubscription.cache_consistency_id) {
                await this.removeSubscription(ctx, key);
            }
        }
        // find qsr's that have to be added
        for (const [key, qsr] of qsrCache.cache.entries()) {
            if (!this.queuedSubscriptions.has(key)) {
                this.addSubscriptionAndStart(ctx, key, qsr);
            }
        }
        return qsrCache.highest_cache_consistency_id;
    }
    async start(ctx) {
        const qsrCache = await queued_subscription_cache_1.loadCache(this.config.Gcp.gaeVersion);
        await this.refreshSubscriptionsFromCache(ctx, qsrCache);
        await this.initializeCacheChangeObserver(ctx);
        // start listening for changes... kicks off its own
        await this.initializeQsrChangeObserver();
        await this.publishSchema(ctx);
        await this.initializeCacheRefreshRequest(ctx);
    }
    async stop(ctx) {
        await this.qsrChangeObserver.stop();
        await this.qsrLocalCacheObserver.stop();
        await this.stopAndClearSubscriptions(ctx);
    }
    async stopAndClearSubscriptions(ctx) {
        await Promise.all(Array.from(this.queuedSubscriptions, async (queuedSubscription) => {
            return queuedSubscription[1].stop();
        }));
        this.queuedSubscriptions.clear();
    }
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscriptionAndStart(ctx, key, request) {
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
    async removeSubscription(ctx, key) {
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
            handler: async (ctx, response) => {
                await this.handler_updateServiceSchemaHandler(ctx, response);
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
            handler: async (ctx, response) => {
                await this.handler_GetAllQueuedSubscriptionRequests(ctx, response);
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
    async initializeCacheChangeObserver(ctx) {
        // we listen directly to NODE_CHANGE_NOTIFICATIONS as the qsr_cache is not a full
        // Relay object
        // HOWEVER each service broadcasts on the channel so we filter out ones genrerated by this
        // service
        await this.qsrLocalCacheObserver.init();
        // kick off on its own promise chain
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.qsrLocalCacheObserver.start(async (ctx, response) => {
            await this.handler_localCacheChange(ctx, response);
        });
        return;
    }
    /**
     * use instance methods for handlers as we want to take advantage of the automated tracing
     */
    async handler_localCacheChange(ctx, response) {
        // we are very careful on messagees passed in as they may not be what we think they are
        if (response.publisher_service_name === this.config.serviceName) {
            // double check...as messages might not be what we think they should be
            if (response.oid) {
                const { scope } = new oid_1.Oid(response.oid).unwrap();
                if (scope === queued_subscription_cache_1.QsrCacheOidScope) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.refreshSubscriptionsFromCache(ctx);
                }
            }
        }
    }
    async handler_updateServiceSchemaHandler(ctx, response) {
        ctx.logger.log(`received response to :${this.config.serviceName}_updateServiceSchema`);
    }
    async handler_GetAllQueuedSubscriptionRequests(ctx, response) {
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
                await this.stopAndClearSubscriptions(ctx);
                await queued_subscription_cache_1.saveCache(new queued_subscription_cache_1.QueuedSubscriptionCache(this.config.Gcp.gaeVersion));
            }
        }
        if (response.response.errors) {
            ctx.logger.log(`Error in response: ${response.response.errors.toString()}`);
        }
    }
    async handler_onQueuedSubscriptionRequestChange(ctx, response) {
        var _a, _b;
        const changedQueuedRequest = (_b = (_a = response.subscription_response.data) === null || _a === void 0 ? void 0 : _a[`onQueuedSubscriptionRequestChange`]) === null || _b === void 0 ? void 0 : _b.node;
        if (changedQueuedRequest) {
            // All we do is add it to the cache... the cache will update, and the localCacheObserver will force the update to live subscriptions
            //
            await this.process_incoming_qsrs(ctx, [changedQueuedRequest]);
        }
    }
}
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Array]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "process_incoming_qsrs", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext,
        queued_subscription_cache_1.QueuedSubscriptionCache]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "refreshSubscriptionsFromCache", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "start", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "stop", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "stopAndClearSubscriptions", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, String, Object]),
    __metadata("design:returntype", queued_subscription_1.QueuedSubscription)
], QueuedSubscriptionServer.prototype, "addSubscriptionAndStart", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, String]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "removeSubscription", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "publishSchema", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "initializeCacheRefreshRequest", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "initializeCacheChangeObserver", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "handler_localCacheChange", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "handler_updateServiceSchemaHandler", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "handler_GetAllQueuedSubscriptionRequests", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionServer.prototype, "handler_onQueuedSubscriptionRequestChange", null);
exports.QueuedSubscriptionServer = QueuedSubscriptionServer;
//# sourceMappingURL=queued-subscription-server.js.map