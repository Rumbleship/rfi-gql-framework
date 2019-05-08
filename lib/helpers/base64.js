"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toBase64(source) {
    return Buffer.from('' + source).toString('base64');
}
exports.toBase64 = toBase64;
function fromBase64(source) {
    return Buffer.from(source, 'base64').toString('ascii');
}
exports.fromBase64 = fromBase64;
//# sourceMappingURL=base64.js.map