"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gql_1 = require("../../gql");
const transformers_1 = require("../transformers");
/**
 * Processes a filter passed in by the framework and converts
 * @param filter An object that may contain properties matching *_between
 */
function convertToSequelizeDateFilters(filter, date_suffix, range_suffix) {
    for (const key of Reflect.ownKeys(filter)) {
        if (typeof key === 'string') {
            if (key.endsWith(range_suffix)) {
                const range = Reflect.get(filter, key);
                if (range instanceof gql_1.DateRange) {
                    filter = transformers_1.create_date_filter(filter, key.substr(0, key.length - range_suffix.length) + date_suffix, range);
                    Reflect.deleteProperty(filter, key);
                }
            }
        }
    }
    return filter;
}
exports.convertToSequelizeDateFilters = convertToSequelizeDateFilters;
//# sourceMappingURL=convert-to-sequelize-date-filters.js.map