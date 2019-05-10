"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
function create_date_filter(filterBy, date_key, between, test_for_any) {
    if (between) {
        if (between.from && between.to) {
            Reflect.set(filterBy, date_key, {
                [sequelize_1.Op.between]: [between.from, between.to]
            });
        }
        else {
            if (between.from) {
                Reflect.set(filterBy, date_key, { [sequelize_1.Op.gte]: between.from });
            }
            else {
                if (between.to) {
                    Reflect.set(filterBy, date_key, { [sequelize_1.Op.lte]: between.to });
                }
            }
        }
    }
    else {
        if (test_for_any !== undefined) {
            delete filterBy.verified;
            if (test_for_any) {
                Reflect.set(filterBy, date_key, { [sequelize_1.Op.ne]: null });
            }
            else {
                Reflect.set(filterBy, date_key, { [sequelize_1.Op.eq]: null });
            }
        }
    }
    return filterBy;
}
exports.create_date_filter = create_date_filter;
//# sourceMappingURL=date-range-filter.js.map