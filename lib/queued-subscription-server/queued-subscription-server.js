"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = void 0;
const queued_subscription_1 = require("./queued-subscription");
const iterable_connection_type_1 = require("../gql/relay/iterable-connection.type");
const queued_subscription_request_relay_1 = require("./queued_subscription_request/gql/queued_subscription_request.relay");
const inititialize_queued_subscription_relay_1 = require("./inititialize_queued_subscription_relay");
const acl_1 = require("@rumbleship/acl");
const uuid = require("uuid");
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
        const gql_query_string = `
    subscription {
      onOrdersQueuedSubscriptionRequestChange (  watch_list: [active]) {
        idempotency_key
        node {
          id
          marshalled_acl
          gql_query_string
          active
          authorized_requestor_id
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
            authorized_requestor_id: '',
            marshalled_acl,
            gql_query_string,
            publish_to_topic_name: '',
            client_request_uuid: uuid.v4(),
            active: true,
            create_unique_subscription: true,
            onResponseHook
        }, this.config);
    }
    async start(ctx) {
        // Should be an independant promise chain
        // tslint:disable-next-line: no-floating-promises
        this.queuedSubscriptionRequestObserver.start();
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
            // tslint:disable-next-line: no-floating-promises
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
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscription(key, request) {
        if (this.queuedSubscriptions.has(key)) {
            throw new Error(`QueuedSubscription: ${request.client_request_uuid} already running`);
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