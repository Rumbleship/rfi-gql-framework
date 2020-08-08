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
    const ids_for_filter = Object.keys(filter).filter(k => k && k.match(/_id$/));
    for (const id_field of ids_for_filter) {
        const val = Reflect.get(filter, id_field);
        if (typeof val === 'string') {
            const oid = new oid_1.Oid(Reflect.get(filter, id_field));
            const { id } = oid.unwrap();
            Reflect.set(filter, id_field, id);
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