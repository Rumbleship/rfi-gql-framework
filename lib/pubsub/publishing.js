"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oid_1 = require("@rumbleship/oid");
const node_notification_1 = require("../gql/node-notification");
function payloadFromModel(model) {
    var _a;
    const fullClassName = model.constructor.name;
    const idx = fullClassName.toString().lastIndexOf('Model');
    const payloadClassName = fullClassName.substr(0, idx);
    const modelId = (_a = model) === null || _a === void 0 ? void 0 : _a.get('id');
    const oid = oid_1.Oid.create(payloadClassName, modelId).toString();
    return { oid: oid, payload_class: payloadClassName, id: modelId };
}
async function _publishPayload(pubSub, notification, rawPayload, deltas) {
    var rval = payloadFromModel(rawPayload);
    rval.action = notification;
    rval.deltas = deltas;
    const payload = JSON.stringify(rval);
    const topicName = `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
    // FIXME - enable when logger object can be used here
    //logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    //logger.debug('Publishing ' + payload + ' to topic ' + topicName);
    pubSub.publish(topicName, payload);
}
function publishPayload(pubSub, notification, payload, deltas) {
    return _publishPayload(pubSub, notification, payload, deltas);
}
exports.publishPayload = publishPayload;
//# sourceMappingURL=publishing.js.map