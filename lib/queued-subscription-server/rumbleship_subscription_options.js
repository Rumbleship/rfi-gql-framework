"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RumbleshipSubscription = exports.RumbleshipSubscriptionOptions = exports.enableQueuedSubscriptionSupport = void 0;
const type_graphql_1 = require("type-graphql");
/***
 * @NOTE We make a 'pseudo' topic by adding queued in front og the topic to subscribe to if the context
 * has isQueuedSubscription set.
 *
 * @see RfiPubSub subscribe function to see how this peudo topic is handled
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
function RumbleshipSubscriptionOptions(opts) {
    const topics = opts.topics;
    const wrappedTopics = (args) => {
        return enableQueuedSubscriptionSupport(args, topics);
    };
    return { ...opts, topics: wrappedTopics };
}
exports.RumbleshipSubscriptionOptions = RumbleshipSubscriptionOptions;
function RumbleshipSubscription(returnTypeFunc, options) {
    const opts = RumbleshipSubscriptionOptions(options);
    return type_graphql_1.Subscription(returnTypeFunc, opts);
}
exports.RumbleshipSubscription = RumbleshipSubscription;
//# sourceMappingURL=rumbleship_subscription_options.js.map