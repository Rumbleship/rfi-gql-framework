"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNotification = void 0;
class NodeNotification {
    constructor(notificationOf, idempotency_key, node) {
        if (!idempotency_key) {
            throw Error(`Must have a idempotency_key set on change of ${node.constructor.name}`);
        }
        this.notificationOf = notificationOf;
        this.node = node;
        this.idempotency_key = idempotency_key;
    }
}
exports.NodeNotification = NodeNotification;
//# sourceMappingURL=node-notification.js.map