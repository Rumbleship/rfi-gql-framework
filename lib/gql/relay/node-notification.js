"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNotification = void 0;
class NodeNotification {
    constructor(notificationOf, node) {
        this.notificationOf = notificationOf;
        this.node = node;
        this.sequence = Date.now();
    }
}
exports.NodeNotification = NodeNotification;
//# sourceMappingURL=node-notification.js.map