"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionTracePropagation = void 0;
exports.SubscriptionTracePropagation = async ({ root, args, context, info }, next) => {
    const resp = await next();
    console.log(resp);
    return resp;
};
//# sourceMappingURL=subscription-trace-propagation.middleware.js.map