"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const oid_1 = require("@rumbleship/oid");
function uniqueSubscriptionNamePart(topicName, subscriptionOptions) {
    var _a;
    if (subscriptionOptions && subscriptionOptions.asService) {
        return `${topicName}-${_a = subscriptionOptions.serviceName, (_a !== null && _a !== void 0 ? _a : 'any')}-ServiceSubscription`;
    }
    else {
        return `${topicName}-${os_1.hostname()}`;
    }
}
exports.uniqueSubscriptionNamePart = uniqueSubscriptionNamePart;
async function createPayload(raw, resolver, NotificationType) {
    return resolver.ctx.beeline.bindFunctionToTrace(async () => {
        return resolver.ctx.beeline.withSpan({ name: 'createPayload' }, async (_span) => {
            const received = JSON.parse(raw.data.toString());
            const id = (() => {
                switch (typeof received.oid) {
                    case 'string':
                        return received.oid;
                    case 'object':
                        return new oid_1.Oid(received.oid).toString();
                    case 'undefined':
                    default:
                        throw new Error('Cannot create payload without an id');
                }
            })();
            const node = await resolver.getOne(id);
            resolver.ctx.beeline.addContext({ 'node.id': id, 'payload.action': received.action });
            const gql_node_notification = new NotificationType(received.action, node);
            return gql_node_notification;
        });
    })();
}
exports.createPayload = createPayload;
/**
 * @deprecated in favor of combined `createPayload()`
 */
async function createPayloadUsingStr(rawPayload, resolver, notificationClsType) {
    var _a;
    // tslint:disable-next-line: no-console
    console.warn('`pubsub_helper.createPayloadUsingStr` is deprecated; use generic `createPayload` instead');
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = (_a = recieved) === null || _a === void 0 ? void 0 : _a.oid;
    const node = await resolver.getOne(strOid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingStr = createPayloadUsingStr;
/**
 * @deprecated in favor of combined `createPayload()`
 */
async function createPayloadUsingOid(rawPayload, resolver, notificationClsType) {
    var _a;
    // tslint:disable-next-line: no-console
    console.warn('`pubsub_helper.createPayloadUsingOid` is deprecated; use generic `createPayload` instead');
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = (_a = recieved) === null || _a === void 0 ? void 0 : _a.oid;
    const oid = new oid_1.Oid(strOid);
    const node = await resolver.getOne(oid);
    const gqlNodeNotification = new notificationClsType(recieved.action, node);
    return gqlNodeNotification;
}
exports.createPayloadUsingOid = createPayloadUsingOid;
//# sourceMappingURL=helper.js.map