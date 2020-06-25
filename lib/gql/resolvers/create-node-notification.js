"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeNotification = exports.uniqueSubscriptionNamePart = void 0;
const os_1 = require("os");
function uniqueSubscriptionNamePart(topicName, subscriptionOptions) {
    var _a;
    if (subscriptionOptions && subscriptionOptions.asService) {
        return `${topicName}-${(_a = subscriptionOptions.serviceName) !== null && _a !== void 0 ? _a : 'any'}-ServiceSubscription`;
    }
    else {
        return `${topicName}-${os_1.hostname()}`;
    }
}
exports.uniqueSubscriptionNamePart = uniqueSubscriptionNamePart;
async function createNodeNotification(raw, resolver, NotificationType) {
    const ctx = resolver.ctx;
    return ctx.beeline.bindFunctionToTrace(async () => {
        return ctx.beeline.withAsyncSpan({ name: 'createPayload' }, async (_span) => {
            const received = JSON.parse(raw.data.toString());
            ctx.beeline.addTraceContext({
                'relay.node.id': received.oid.toString(),
                'payload.action': received.action
            });
            const node = await resolver.getOne(received.oid);
            const gql_node_notification = new NotificationType(received.action, node);
            return gql_node_notification;
        });
    })();
}
exports.createNodeNotification = createNodeNotification;
//# sourceMappingURL=create-node-notification.js.map