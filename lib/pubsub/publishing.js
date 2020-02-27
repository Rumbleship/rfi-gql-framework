"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_notification_1 = require("../gql/node-notification");
const db_1 = require("../db");
function payloadFromModel(model) {
    var _a;
    /* const fullClassName: string = model.constructor.name;
    const idx: number = fullClassName.toString().lastIndexOf('Model');
    const payloadClassName: string = fullClassName.substr(0, idx);
    */
    const modelId = (_a = model) === null || _a === void 0 ? void 0 : _a.get('id');
    const oid = db_1.getOidFor(model).toString();
    return { oid, id: modelId };
}
async function _publishPayload(pubSub, notification, rawPayload, deltas) {
    const rval = payloadFromModel(rawPayload);
    rval.action = notification;
    rval.deltas = deltas;
    rval.publisher_version = pubSub.publisher_version;
    const payload = JSON.stringify(rval);
    const oidScope = db_1.getScopeFor(rawPayload);
    const topicName = `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${oidScope}`;
    // FIXME - enable when logger object can be used here
    // logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
    // tslint:disable-next-line: no-floating-promises
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    // logger.debug('Publishing ' + payload + ' to topic ' + topicName);
    // tslint:disable-next-line: no-floating-promises
    pubSub.publish(topicName, payload);
}
function publishPayload(pubSub, notification, payload, deltas) {
    return _publishPayload(pubSub, notification, payload, deltas);
}
exports.publishPayload = publishPayload;
//# sourceMappingURL=publishing.js.map