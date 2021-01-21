"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeNotification = void 0;
async function createNodeNotification(raw, resolver, NotificationType, delta_keys) {
    const ctx = resolver.ctx;
    return ctx.beeline.bindFunctionToTrace(async () => {
        return ctx.beeline.withAsyncSpan({ name: 'createPayload' }, async (_span) => {
            const received = JSON.parse(raw.data.toString());
            const modeldeltas = [];
            if (delta_keys) {
                for (const key of delta_keys) {
                    const found = received.deltas.find(delta => delta.key === key);
                    if (found) {
                        modeldeltas.push(found);
                    }
                }
            }
            ctx.beeline.addTraceContext({
                'relay.node.id': received.oid.toString(),
                'payload.action': received.action
            });
            const node = await resolver.getOne(received.oid);
            const gql_node_notification = new NotificationType(received.action, received.idempotency_key, node, modeldeltas);
            gql_node_notification.setTrace(received.marshalled_trace);
            return gql_node_notification;
        });
    })();
}
exports.createNodeNotification = createNodeNotification;
//# sourceMappingURL=create-node-notification.js.map