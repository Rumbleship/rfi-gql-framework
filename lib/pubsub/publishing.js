"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_notification_1 = require("../gql/node-notification");
const db_1 = require("../db");
function payloadFromModel(model) {
    var _a, _b;
    let node;
    if (db_1.apiKey in model) {
        node = Reflect.get(model, db_1.apiKey);
    }
    /* const fullClassName: string = model.constructor.name;
    const idx: number = fullClassName.toString().lastIndexOf('Model');
    const payloadClassName: string = fullClassName.substr(0, idx);
    */
    const modelId = (_a = model) === null || _a === void 0 ? void 0 : _a.get('id');
    const oid = (_b = node) === null || _b === void 0 ? void 0 : _b.id.toString();
    return { oid, id: modelId };
}
async function _publishPayload(pubSub, notification, rawPayload, deltas) {
    const rval = payloadFromModel(rawPayload);
    rval.action = notification;
    rval.deltas = deltas;
    const payload = JSON.stringify(rval);
    const topicName = `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
    // FIXME - enable when logger object can be used here
    // logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    // logger.debug('Publishing ' + payload + ' to topic ' + topicName);
    pubSub.publish(topicName, payload);
}
function publishPayload(pubSub, notification, payload, deltas) {
    return _publishPayload(pubSub, notification, payload, deltas);
}
exports.publishPayload = publishPayload;
//# sourceMappingURL=publishing.js.map