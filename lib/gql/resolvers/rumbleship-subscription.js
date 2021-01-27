"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RumbleshipSubscription = exports.RumbleshipSubscriptionOptions = exports.enableQueuedSubscriptionSupport = void 0;
const type_graphql_1 = require("type-graphql");
const filter_by_subscription_filter_1 = require("./filter-by-subscription-filter");
/***
 * @NOTE We make a 'faux' topic by adding queued in front og the topic to subscribe to if the context
 * has isQueuedSubscription set.
 *
 * @see RfiPubSub subscribe function to see how this faux topic is handled
 *
 */
function enableQueuedSubscriptionSupport(params, topics) {
    if (topics) {
        if (typeof topics === 'function') {
            topics = topics(params);
        }
        if (!Array.isArray(topics)) {
            topics = [topics];
        }
    }
    else {
        topics = [];
    }
    if (params.context.isQueuedSubscription) {
        return topics.map(topic => `queued-${topic}`);
    }
    else {
        return topics;
    }
}
exports.enableQueuedSubscriptionSupport = enableQueuedSubscriptionSupport;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function RumbleshipSubscriptionOptions(opts) {
    var _a;
    const topics = opts.topics;
    const wrappedTopics = (args) => {
        return enableQueuedSubscriptionSupport(args, topics);
    };
    return {
        ...opts,
        topics: wrappedTopics,
        filter: (_a = opts.filter) !== null && _a !== void 0 ? _a : filter_by_subscription_filter_1.filterBySubscriptionFilter
        // ...(!opts.filter ? { filter: filterBySubscriptionFilter } : {})
    };
}
exports.RumbleshipSubscriptionOptions = RumbleshipSubscriptionOptions;
/**
 * Decorator wrapping standard @Subscription that add in QueuedSubscription processing
 * @param returnTypeFunc
 * @param options
 */
function RumbleshipSubscription(returnTypeFunc, options) {
    const opts = RumbleshipSubscriptionOptions(options);
    return type_graphql_1.Subscription(returnTypeFunc, opts);
}
exports.RumbleshipSubscription = RumbleshipSubscription;
//# sourceMappingURL=rumbleship-subscription.js.map