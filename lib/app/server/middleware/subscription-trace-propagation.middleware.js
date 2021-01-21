"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionTracePropagation = void 0;
const o11y_1 = require("@rumbleship/o11y");
exports.SubscriptionTracePropagation = async ({ root, args, context, info }, next) => {
    const resp = await next();
    const marshalled_trace = info.parentType.name === 'Subscription'
        ? context.beeline.bindFunctionToTrace(() => o11y_1.RumbleshipBeeline.marshalTraceContext(context.beeline.getTraceContext()))()
        : undefined;
    // console.log(resp);
    return { ...resp, marshalled_trace };
};
//# sourceMappingURL=subscription-trace-propagation.middleware.js.map