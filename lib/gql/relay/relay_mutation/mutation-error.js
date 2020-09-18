"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationError = void 0;
class MutationError extends Error {
    constructor(originalError, clientMutationId = null, message) {
        var _a, _b;
        super(`${message ? message + ':' : ''}${(_a = originalError.message) !== null && _a !== void 0 ? _a : ''}`);
        this.clientMutationId = clientMutationId;
        this.stack = (_b = originalError.stack) !== null && _b !== void 0 ? _b : this.stack;
    }
}
exports.MutationError = MutationError;
//# sourceMappingURL=mutation-error.js.map