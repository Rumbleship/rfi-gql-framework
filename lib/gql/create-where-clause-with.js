"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oid_1 = require("@rumbleship/oid");
function createWhereClauseWith(filter) {
    if (filter.id) {
        const oid = new oid_1.Oid(filter.id);
        const { id: databaseId } = oid.unwrap();
        delete filter.id;
        Reflect.set(filter, 'id', databaseId);
    }
    return filter;
}
exports.createWhereClauseWith = createWhereClauseWith;
//# sourceMappingURL=create-where-clause-with.js.map