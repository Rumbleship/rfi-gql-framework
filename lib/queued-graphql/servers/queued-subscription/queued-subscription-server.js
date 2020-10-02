"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = void 0;
const os_1 = require("os");
const queued_subscription_1 = require("./queued-subscription");
const queued_gql_request_client_1 = require("../../clients/queued-gql-request-client");
const shared_1 = require("../../shared");
const pubsub_1 = require("@google-cloud/pubsub");
// eslint-disable-next-line import/no-cycle
const queued_subscription_cache_1 = require("../../queued-subscription-cache");
const init_sequelize_1 = require("../../../app/server/init-sequelize");
exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = 'QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC';
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
      }
    }
    `;
class QueuedSubscriptionServer {
    constructor(config, schema) {
        this.config = config;
        this.schema = schema;
        this.queuedSubscriptions = new Map();
        this.in_memory_cache_consistency_id = 0;
        this.qsrChangeObserver = new shared_1.RfiPubSubSubscription(this.config, new pubsub_1.PubSub(this.config.Gcp.Auth), exports.QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC, `{QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}_${os_1.hostname()}` // Every instance needs to update its cache.
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
            const changedQueuedRequest = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a[`onQueuedSubscriptionRequestChange`]) === null || _b === void 0 ? void 0 : _b.node;
            if (changedQueuedRequest && changedQueuedRequest.id) {
                if (changedQueuedRequest.cache_consistency_id) {
                    const sequelize = init_sequelize_1.getSequelizeInstance();
                    if (sequelize) {
                        const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
                        try {
                            const qsrCache = await queued_subscription_cache_1.loadCache({ transaction });
                            // Has anotehr instance already saved a later version of the cache?
                            if (this.in_memory_cache_consistency_id < qsrCache.highest_cache_consistency_id) {
                                await this.refreshSubscriptionsFromCache(qsrCache);
                            }
                            if (qsrCache.highest_cache_consistency_id < changedQueuedRequest.cache_consistency_id) {
                                try {
                                    queued_subscription_1.QueuedSubscription.validateSubscriptionRequest(this.schema, changedQueuedRequest);
                                    const key = changedQueuedRequest.id.toString();
                                    await this.removeSubscription(key);
                                    if (changedQueuedRequest.active) {
                                        this.addSubscriptionAndStart(key, changedQueuedRequest);
                                    }
                                }
                                catch (error) {
                                    // swollow the error
                                    // TODO determine the type of error and swollow or spit it out
                                    ctx.logger.log(`Couldnt process qsr in ${this.config.serviceName}. Error: ${error.toString()}`);
                                }
                                // update the cache...
                                qsrCache.clear();
                                qsrCache.highest_cache_consistency_id = changedQueuedRequest.cache_consistency_id;
                                qsrCache.add(Array.from(this.queuedSubscriptions.values()));
                                await queued_subscription_cache_1.saveCache(qsrCache, { transaction });
                                this.in_memory_cache_consistency_id = qsrCache.highest_cache_consistency_id;
                                await transaction.commit();
                            }
                        }
                        catch (seqError) {
                            // TODO what should be logged?
                            ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
                            await transaction.rollback();
                        }
                    }
                }
            }
        });
        return;
    }
    async refreshSubscriptionsFromCache(qsrCache) {
        this.in_memory_cache_consistency_id = qsrCache.highest_cache_consistency_id;
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
    }
    async start(ctx) {
        // Should be an independant promise chain
        // start listening for changes...
        await this.initializeQsrChangeObserver();
        this.queuedGqlRequestClient.onResponse({
            client_request_id: 'PublishQueuedSubscriptions',
            handler: async (response, ctx) => {
                // We can get a response from multiple services, and google pub sub can
                // deliver it twice.
                // We actually don't care about the response, as we call a mutation to force a broadcast of the
                // QSR's in the main store
                // This should only happen in development, as we suppress errors in production
                //
                if (response.response.errors) {
                    ctx.logger.log(`Error in response: ${response.response.errors.toString()}`);
                }
            }
        });
        // we kick off a floating promise chain here...
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.queuedGqlRequestClient.start();
        // now we make the request
        await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id: 'PublishQueuedSubscriptions',
            respond_on_error: false,
            gql_query_string: `mutation {}`
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
}
exports.QueuedSubscriptionServer = QueuedSubscriptionServer;
//# sourceMappingURL=queued-subscription-server.js.map