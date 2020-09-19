"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = void 0;
const queued_subscription_1 = require("./queued-subscription");
const iterable_connection_type_1 = require("../gql/relay/iterable-connection.type");
const queued_subscription_request_relay_1 = require("./queued_subscription_request/gql/queued-subscription-request.relay");
const inititialize_queued_subscription_relay_1 = require("./inititialize-queued-subscription-relay");
const acl_1 = require("@rumbleship/acl");
const uuid = require("uuid");
const webhook_1 = require("./webhook");
const helpers_1 = require("./helpers");
const pubsub_1 = require("@google-cloud/pubsub");
class QueuedSubscriptionServer {
    constructor(schema, config) {
        this.schema = schema;
        this.config = config;
        this.queuedSubscriptions = new Map();
        this.queuedSubscriptionRequestObserver = this.initializeRequestObserver(schema);
    }
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    initializeRequestObserver(schema) {
        const header = acl_1.Authorizer.createServiceUserAuthHeader();
        const authorizer = acl_1.Authorizer.make(header, true);
        const marshalled_acl = authorizer.marshalClaims();
        const baseName = `${inititialize_queued_subscription_relay_1.getRelayPrefixLowerCase()}`;
        const capitalizedName = baseName ? baseName[0].toUpperCase() + baseName.slice(1) : '';
        const gql_query_string = `
    subscription {
      on${capitalizedName}QueuedSubscriptionRequestChange (  watch_list: [active]) {
        idempotency_key
        node {
          id
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
        const onResponseHook = async (response) => {
            var _a, _b;
            const changedQueuedRequest = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.onOrdersQueuedSubscriptionRequestChange) === null || _b === void 0 ? void 0 : _b.node;
            if (changedQueuedRequest && changedQueuedRequest.id) {
                const key = changedQueuedRequest.id.toString();
                await this.removeSubscription(key);
                if (changedQueuedRequest.active) {
                    await this.addSubscription(key, changedQueuedRequest).start();
                }
            }
        };
        return new queued_subscription_1.QueuedSubscription(schema, {
            id: 'qsrObserver',
            owner_id: '',
            marshalled_acl,
            gql_query_string,
            publish_to_topic_name: '',
            subscription_name: uuid.v4(),
            active: true,
            create_unique_subscription: true,
            onResponseHook
        }, this.config);
    }
    async start(ctx) {
        // Should be an independant promise chain
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.queuedSubscriptionRequestObserver.start();
        // Make sure any webhooks are setup on gcloud..
        await this.validateWebhooksSetup(ctx);
        // load up active subscriptions
        const queuedSubscriptionRequestService = ctx.container.get(`${inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()}Service`);
        const filter = new queued_subscription_request_relay_1.QueuedSubscriptionRequestFilter();
        filter.first = 20;
        filter.active = true;
        const activeSubscriptions = new iterable_connection_type_1.IterableConnection(filter, async (paged_filter) => {
            return queuedSubscriptionRequestService.getAll(paged_filter);
        });
        for await (const activeSubscription of activeSubscriptions) {
            const key = activeSubscription.id.toString();
            const queuedSubscription = this.addSubscription(key, activeSubscription);
            // todo add tracing
            // These are independant promise chains
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            queuedSubscription.start();
        }
    }
    async stop() {
        await this.queuedSubscriptionRequestObserver.stop();
        await Promise.all(Array.from(this.queuedSubscriptions, async (queuedSubscription) => {
            return queuedSubscription[1].stop();
        }));
        this.queuedSubscriptions.clear();
    }
    async validateWebhooksSetup(ctx) {
        const webhookService = ctx.container.get(`${inititialize_queued_subscription_relay_1.getWebhookScopeName()}Service`);
        const filter = new webhook_1.WebhookFilter();
        filter.first = 20;
        const activeWebhooks = new iterable_connection_type_1.IterableConnection(filter, async (paged_filter) => {
            return webhookService.getAll(paged_filter);
        });
        for await (const webhook of activeWebhooks) {
            if (webhook.topic_name && webhook.gcloud_subscription) {
                try {
                    const gcloudPubSub = new pubsub_1.PubSub(this.config.Auth);
                    const topic = await helpers_1.gcpGetTopic(gcloudPubSub, webhook.topic_name);
                    await helpers_1.gcpCreatePushSubscription(topic, webhook.gcloud_subscription, webhook.subscription_url);
                }
                catch (error) {
                    const ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
                    if (error.code !== ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
                        ctx.logger.error(`Webhook: ${webhook.id.toString()} failed to validate topic/subscription`, { error });
                    }
                }
            }
        }
    }
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscription(key, request) {
        if (this.queuedSubscriptions.has(key)) {
            throw new Error(`QueuedSubscription: id: ${key}, Name: ${request.subscription_name} already running`);
        }
        const queuedSubscription = new queued_subscription_1.QueuedSubscription(this.schema, request, this.config);
        this.queuedSubscriptions.set(key, queuedSubscription);
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