"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderClause = void 0;
function createOrderClause(orderBy) {
    if ((orderBy === null || orderBy === void 0 ? void 0 : orderBy.keys) && orderBy.keys.length) {
        return orderBy.keys;
    }
    else {
        return [['id', 'DESC']];
    }
}
exports.createOrderClause = createOrderClause;
//# sourceMappingURL=create-order-clause.js.map