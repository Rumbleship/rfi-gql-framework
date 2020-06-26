"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logErrorsPlugin = void 0;
exports.logErrorsPlugin = {
    requestDidStart() {
        return {
            didEncounterErrors(request_context, ...rest) {
                const { errors, context } = request_context;
                const [first_error] = errors;
                context.beeline.bindFunctionToTrace(() => {
                    // Treat the first error as most important, add its contents to trace context.
                    if (first_error) {
                        context.beeline.addTraceContext({
                            'error.stack': first_error.stack,
                            'error.message': first_error.message
                        });
                    }
                    // But it's still useful to get each individual error
                    for (const error of errors) {
                        context.beeline.finishSpan(context.beeline.startSpan({
                            name: 'error',
                            'error.stack': error.stack,
                            'error.message': error.message
                        }));
                        context.logger.error(error.stack);
                    }
                })();
            }
        };
    }
};
//# sourceMappingURL=apollo-error.plugin.js.map