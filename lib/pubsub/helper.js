"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
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
function randint(min, max) {
    const diff = max - min;
    return Math.floor(Math.random() * Math.floor(diff)) + min;
}
function randchar() {
    return randint(97, 122); // a-z
}
function randstr(len) {
    return String.fromCharCode(...Array.from(new Array(len), randchar));
}
function uniqueSubscriptionNamePart() {
    return '' + os_1.hostname() + '-' + randstr(6);
}
exports.uniqueSubscriptionNamePart = uniqueSubscriptionNamePart;
// Ideally we could use this as a commonMessageHandler for
// graphql-google-pubsub but as notificationClsType is seemingly defined at
// runtime, we can't use that patttern here
async function nodeNotficationFromPayload(rawPayload, resolver, notificationClsType) {
    var _a;
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = (_a = recieved) === null || _a === void 0 ? void 0 : _a.oid;
    //const oid: Oid = new Oid(strOid);
    //const node: Model = await resolver.getOne(oid)
    const node = await resolver.getOne(strOid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.nodeNotficationFromPayload = nodeNotficationFromPayload;
//# sourceMappingURL=helper.js.map