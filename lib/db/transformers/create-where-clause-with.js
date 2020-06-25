"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhereClauseWith = void 0;
const oid_1 = require("@rumbleship/oid");
const convert_to_sequelize_date_filters_1 = require("./convert-to-sequelize-date-filters");
function createWhereClauseWith(filter) {
    if (filter.id) {
        if (typeof filter.id === 'string') {
            filter.id = new oid_1.Oid(filter.id);
        }
        if (filter.id instanceof oid_1.Oid) {
            const { id: databaseId } = filter.id.unwrap();
            delete filter.id;
            Reflect.set(filter, 'id', databaseId);
        }
    }
    /***
     * Look for any DateRange attributes and convert to sequelize operations
     *
     */
    filter = convert_to_sequelize_date_filters_1.convertToSequelizeDateFilters(filter, '_at', '_between');
    return filter;
}
exports.createWhereClauseWith = createWhereClauseWith;
//# sourceMappingURL=create-where-clause-with.js.map