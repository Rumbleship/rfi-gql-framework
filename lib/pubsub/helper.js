"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayloadUsingOid = exports.createPayloadUsingStr = exports.uniqueSubscriptionNamePart = void 0;
const os_1 = require("os");
const oid_1 = require("@rumbleship/oid");
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
// Ideally we could use this as a commonMessageHandler for
// graphql-google-pubsub but as notificationClsType is seemingly defined at
// runtime, we can't use that patttern here
async function createPayloadUsingStr(rawPayload, resolver, notificationClsType) {
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = recieved === null || recieved === void 0 ? void 0 : recieved.oid;
    const node = await resolver.getOne(strOid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingStr = createPayloadUsingStr;
async function createPayloadUsingOid(rawPayload, resolver, notificationClsType) {
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = recieved === null || recieved === void 0 ? void 0 : recieved.oid;
    const oid = new oid_1.Oid(strOid);
    const node = await resolver.getOne(oid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingOid = createPayloadUsingOid;
//# sourceMappingURL=helper.js.map