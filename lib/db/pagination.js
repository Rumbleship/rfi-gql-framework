"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLimitAndOffset = exports.calculateBeforeAndAfter = void 0;
const base64_1 = require("../helpers/base64");
const DEFAULT_LIMIT_NUM = 20;
function calculateBeforeAndAfter(offset, limit, count) {
    return {
        pageBefore: offset === 0 ? false : true,
        pageAfter: offset + limit < count ? true : false
    };
}
exports.calculateBeforeAndAfter = calculateBeforeAndAfter;
function calculateLimitAndOffset(after, first, before, last) {
    let offset = 0;
    let limit = first ? first : DEFAULT_LIMIT_NUM; // if we have no after, or before...
    if (after) {
        if (before) {
            throw new Error('Incompatible use of both before and after');
        }
        if (last) {
            throw new Error('Incompatible use of both last and after');
        }
        offset = 1 + parseInt(base64_1.fromBase64(after), 10);
        if (first) {
            limit = first;
        }
    }
    if (before) {
        if (first) {
            throw new Error('Incompatible use of both first and before');
        }
        offset = parseInt(base64_1.fromBase64(before), 10);
        offset = offset < 0 ? 0 : offset;
        if (last) {
            limit = last;
        }
        if (offset < limit) {
            limit = offset;
            offset = 0;
        }
        else {
            offset = offset - limit;
        }
    }
    return { offset, limit };
}
exports.calculateLimitAndOffset = calculateLimitAndOffset;
//# sourceMappingURL=pagination.js.map