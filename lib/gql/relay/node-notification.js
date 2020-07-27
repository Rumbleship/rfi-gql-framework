"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNotification = void 0;
class NodeNotification {
    constructor(notificationOf, change_uuid, node) {
        if (!change_uuid) {
            throw Error(`Must have a change_uuid set on change of ${node.constructor.name}`);
        }
        this.notificationOf = notificationOf;
        this.node = node;
        this.change_uuid = change_uuid;
    }
}
exports.NodeNotification = NodeNotification;
//# sourceMappingURL=node-notification.js.map