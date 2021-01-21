"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNotification = exports.ModelDeltaClass = void 0;
class ModelDeltaClass {
    constructor(delta) {
        this.key = delta.key;
        this.newValue = `${delta.newValue}`;
        this.previousValue = `${delta.previousValue}`;
    }
}
exports.ModelDeltaClass = ModelDeltaClass;
class NodeNotification {
    constructor(notificationOf, idempotency_key, node, watch_list_deltas, marshalledTrace) {
        this.marshalledTrace = marshalledTrace;
        this.watch_list_deltas = [];
        if (!idempotency_key) {
            throw Error(`Must have a idempotency_key set on change of ${node.constructor.name}`);
        }
        this.notificationOf = notificationOf;
        this.node = node;
        this.idempotency_key = idempotency_key;
        if (watch_list_deltas) {
            this.watch_list_deltas = watch_list_deltas.map(delta => new ModelDeltaClass(delta));
        }
    }
}
exports.NodeNotification = NodeNotification;
//# sourceMappingURL=node-notification.js.map