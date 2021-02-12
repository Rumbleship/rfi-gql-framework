"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidOidError = exports.NotFoundError = void 0;
/**
 * This probably should be refactored into a standalone package that system can use.
 *
 * For now, right here.
 */
class NotFoundError extends Error {
}
exports.NotFoundError = NotFoundError;
class InvalidOidError extends Error {
    constructor(oid, expected_scope) {
        super(`Invalid oid: ${oid.toString()} does not match ${expected_scope}`);
    }
}
exports.InvalidOidError = InvalidOidError;
//# sourceMappingURL=index.js.map