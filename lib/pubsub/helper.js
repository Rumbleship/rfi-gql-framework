"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oid_1 = require("@rumbleship/oid");
// The commented out currently exists in gql-pubsub-sequelize-engine.ts
// but ideally would be here instead. It does not work for an unknown reason,
// perhaps related to scope and Symbol('PubSubEngine')?
//
// const PubSubKey = Symbol('PubSubEngine');
// export function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
//   Reflect.set(sequelize, PubSubKey, pubSub);
// }
// export function pubSubFrom(sequelize: Sequelize): PubSubEngine | null {
//   const pubSub = Reflect.get(sequelize, PubSubKey);
//   return pubSub ? pubSub : null;
// }
function uniqueSubscriptionNamePart(topicName) {
    return `${topicName}`;
}
exports.uniqueSubscriptionNamePart = uniqueSubscriptionNamePart;
// Ideally we could use this as a commonMessageHandler for
// graphql-google-pubsub but as notificationClsType is seemingly defined at
// runtime, we can't use that patttern here
async function createPayloadUsingStr(rawPayload, resolver, notificationClsType) {
    var _a;
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = (_a = recieved) === null || _a === void 0 ? void 0 : _a.oid;
    const node = await resolver.getOne(strOid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingStr = createPayloadUsingStr;
async function createPayloadUsingOid(rawPayload, resolver, notificationClsType) {
    var _a;
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = (_a = recieved) === null || _a === void 0 ? void 0 : _a.oid;
    const oid = new oid_1.Oid(strOid);
    const node = await resolver.getOne(oid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingOid = createPayloadUsingOid;
//# sourceMappingURL=helper.js.map