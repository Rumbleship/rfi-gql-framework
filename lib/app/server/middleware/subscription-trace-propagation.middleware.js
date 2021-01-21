"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionTracePropagation = void 0;
const o11y_1 = require("@rumbleship/o11y");
exports.SubscriptionTracePropagation = async ({ root, args, context, info }, next) => {
    const resp = await next();
    if (info.parentType.name === 'Subscription') {
        const marshalled_trace = context.beeline.bindFunctionToTrace(() => o11y_1.RumbleshipBeeline.marshalTraceContext(context.beeline.getTraceContext()))();
        Reflect.set(resp, 'marshalled_trace', marshalled_trace);
    }
    return resp;
};
//# sourceMappingURL=subscription-trace-propagation.middleware.js.map