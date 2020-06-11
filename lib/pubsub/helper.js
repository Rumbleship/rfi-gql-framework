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
async function createPayload(raw, invoker, NotificationType) {
    const ctx = invoker.ctx; // ?? invoker.getContext?.apply(invoker)!;
    return ctx.beeline.bindFunctionToTrace(async () => {
        return ctx.beeline.withSpan({ name: 'createPayload' }, async (_span) => {
            const received = JSON.parse(raw.data.toString());
            const node = await (() => {
                // This is awful, ugly, and all sorts of terrible. But I don't have a better way to distinguish
                // ((AT RUNTIME)) whether the invoker was a Resolver (which expects a String) or if it was a Service
                // (which expects an Oid object). Workaround to consider: make the constructor of `Oid` accept
                // a string or an Oid, and just return the Oid object if so...
                // if ('getAssociated' in invoker) {
                //   return invoker.getOne(new Oid(received.id));
                // }
                return invoker.getOne(received.id);
            })();
            ctx.beeline.addContext({ 'node.id': node.id.toString(), 'payload.action': received.action });
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