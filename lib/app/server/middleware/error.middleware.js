"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogErrorMiddlewareFn = void 0;
exports.LogErrorMiddlewareFn = async ({ root, args, context, info }, next) => {
    try {
        await next();
    }
    catch (error) {
        const { beeline, logger } = context;
        const error_meta = {
            'error.message': error.message,
            'error.stack': error.stack
        };
        beeline.addTraceContext(error_meta);
        beeline.finishSpan(beeline.startSpan({ name: 'error', ...error_meta }));
        logger.error(error.stack);
        throw error;
    }
};
//# sourceMappingURL=error.middleware.js.map