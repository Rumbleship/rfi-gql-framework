"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterById = exports.filterBySubscriptionFilter = void 0;
const payload_on_watch_list_1 = require("./payload-on-watch-list");
const oid_1 = require("@rumbleship/oid");
const errors_1 = require("../../app/errors");
/**
 * THis is used as a standalone helper as it can be called from any Resolver - and is the
 * @important DEFAULT filter for any subscription defined with @RumbleshipSubscription
 *
 * It handles looking for notifications that a client has added a watch for as well as
 * ensures that any security is dealt with.
 *
 * Specialized resolvers that need to provide more functionality should follow this function
 *
 * @todo split this function into smaller pieces so the parts can be used by specialized resolvers
 *
 * @param param0
 */
async function filterBySubscriptionFilter({ payload: rawPayload, args, context }) {
    const res = await context.beeline.bindFunctionToTrace(async () => {
        return context.beeline.withAsyncSpan({ name: 'subscription.filterBySubscriptionFilter' }, async () => {
            const nodePayload = JSON.parse(rawPayload.data.toString());
            context.beeline.addTraceContext({ subscription: { filter: args, payload: nodePayload } });
            const traceResult = (ret) => {
                context.beeline.addTraceContext({ subscription: { filter: { result: ret } } });
                return ret;
            };
            let filter = {};
            if (args) {
                if (args.id && args.id !== nodePayload.oid) {
                    return traceResult(false);
                }
                if (!payload_on_watch_list_1.payloadOnWatchList(nodePayload, args === null || args === void 0 ? void 0 : args.watch_list)) {
                    return traceResult(false);
                }
                const { watch_list, ...rest } = args;
                filter = rest !== null && rest !== void 0 ? rest : {};
            }
            // set the id on the filter, so findOne can do an auth check on
            // whether the client is allowed to see this notification
            if (!filter.id) {
                filter.id = nodePayload.oid;
            }
            const oid = new oid_1.Oid(nodePayload.oid);
            const { scope } = oid.unwrap();
            const nodeServices = context.container.get('nodeServices');
            if (scope in nodeServices) {
                // Does this match, and are we allowed to see it?
                const node = await Reflect.get(nodeServices, scope).findOne(filter);
                if (node) {
                    return traceResult(true);
                }
            }
            return traceResult(false);
        });
    })();
    return res;
}
exports.filterBySubscriptionFilter = filterBySubscriptionFilter;
/**
 * @chore https://www.pivotaltracker.com/n/projects/2437211/stories/174433505
 * @deprecated use filterBySubscriptionFilter instead
 * @param param0
 */
async function filterById({ payload: rawPayload, args, context }) {
    const res = await context.beeline.bindFunctionToTrace(async () => {
        return context.beeline.withAsyncSpan({ name: 'subscription.filter' }, async () => {
            if (!(args === null || args === void 0 ? void 0 : args.id)) {
                return true;
            }
            const payload = JSON.parse(rawPayload.data.toString());
            context.beeline.addTraceContext({ 'subscription.filter.id': args.id });
            const oid = new oid_1.Oid(payload.oid);
            const { scope } = oid.unwrap();
            let node;
            const nodeServices = context.container.get('nodeServices');
            if (scope in nodeServices) {
                try {
                    node = await Reflect.get(nodeServices, scope).getOne(oid);
                }
                catch (error) {
                    context.beeline.addTraceContext({ error });
                    if (error instanceof errors_1.NotFoundError) {
                        context.beeline.addTraceContext({ 'subscription.filter.result': false });
                        return false;
                    }
                    throw error;
                }
            }
            const filtered = node ? node.id.toString() === (args === null || args === void 0 ? void 0 : args.id) : false;
            context.beeline.addTraceContext({ 'subscription.filter.result': filtered });
            return filtered;
        });
    })();
    return res;
}
exports.filterById = filterById;
//# sourceMappingURL=filter-by-subscription-filter.js.map