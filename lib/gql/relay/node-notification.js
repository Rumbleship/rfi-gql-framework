"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NodeNotification {
    constructor(notificationOf, node) {
        this.notificationOf = notificationOf;
        this.node = node;
        this.sequence = Date.now();
    }
}
exports.NodeNotification = NodeNotification;
//# sourceMappingURL=node-notification.js.map