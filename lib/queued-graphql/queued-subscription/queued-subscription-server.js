"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscriptionServer = void 0;
const acl_1 = require("@rumbleship/acl");
const uuid = require("uuid");
const queued_subscription_1 = require("./queued-subscription");
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
      onQueuedSubscriptionRequestChange (  watch_list: [active]) {
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
            const changedQueuedRequest = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a[`onQueuedSubscriptionRequestChange`]) === null || _b === void 0 ? void 0 : _b.node;
            // TODO validate that this service's schema can parse and execute the gql document
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
        // TODO need to load up subscriptions that are for this service...
        //
        /*
        // load up active subscriptions
        const queuedSubscriptionRequestService = ctx.container.get<QueuedSubscriptionRequestService>(
          `${getQueuedSubscriptionRequestScopeName()}Service`
        );
        const filter = new QueuedSubscriptionRequestFilter();
        filter.first = 20;
        filter.active = true;
        const activeSubscriptions = new IterableConnection(filter, async paged_filter => {
          return queuedSubscriptionRequestService.getAll(paged_filter);
        });
        for await (const activeSubscription of activeSubscriptions) {
          const key = activeSubscription.id.toString();
    
          const queuedSubscription = this.addSubscription(
            key,
            activeSubscription as IQueuedSubscriptionRequest
          );
          // todo add tracing
          // These are independant promise chains
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          queuedSubscription.start();
        }
        */
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