"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const daterange_type_1 = require("../gql/daterange.type");
const sequelize_1 = require("sequelize");
function create_date_filter(filterBy, date_key, between, test_for_any) {
    if (between && between instanceof daterange_type_1.DateRange) {
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
        /**
         * logic for for testing if a date is set at all.
         *
         * This is because a lot of our code uses a date as a flag as well as a date.
         *
         * For example, if the BankAccount.verified_at date is Null, then it hasnt been verified.
         *
         * Its not great modelling and can be confusing, but its very embedded in our code base
         */
        if (test_for_any !== undefined) {
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