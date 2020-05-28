"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createOrderClause(orderBy) {
    var _a;
    if (((_a = orderBy) === null || _a === void 0 ? void 0 : _a.keys) && orderBy.keys.length) {
        return orderBy.keys;
    }
    else {
        return [['id', 'DESC']];
    }
}
exports.createOrderClause = createOrderClause;
//# sourceMappingURL=create_order_clause.js.map