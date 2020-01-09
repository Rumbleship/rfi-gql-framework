"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_range_filter_1 = require("./date-range-filter");
/**
 * Processes a filter passed in by the framework and converts
 * @param filter An object that may contain properties matching *_between
 */
function convertToSequelizeDateFilters(filter, date_suffix, range_suffix) {
    for (const key of Reflect.ownKeys(filter)) {
        if (typeof key === 'string') {
            if (key.endsWith(range_suffix)) {
                filter = date_range_filter_1.create_date_filter(filter, key.substr(0, key.length - range_suffix.length) + date_suffix, Reflect.get(filter, key));
                Reflect.deleteProperty(filter, key);
            }
        }
    }
    return filter;
}
exports.convertToSequelizeDateFilters = convertToSequelizeDateFilters;
//# sourceMappingURL=convert-to-sequelize-date-filters.js.map