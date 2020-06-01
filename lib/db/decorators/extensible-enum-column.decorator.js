"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
/**
 * Inspired by Plaid's API that considers adding values to Enums as non-breaking changes.
 *
 * We store the raw value as a string, and cast to our TypeScript/GQL Enums on retrieval from DB
 */
function ExtensibleEnumColumn(target_enum, options = {}) {
    if (!Reflect.get(target_enum, 'UNKNOWN')) {
        throw new Error('Enum passed to `ExtensibleEnumColumn` must contain an value `UNKNOWN = UKNOWN`');
    }
    return (target, property_name) => {
        const column_options = {
            type: sequelize_typescript_1.DataType.STRING,
            get() {
                const val = this.getDataValue(property_name);
                if (options.allowNull && !val) {
                    return undefined;
                }
                if (val in target_enum) {
                    return val;
                }
                return Reflect.get(target_enum, 'UNKNOWN');
            },
            set(val) {
                this.setDataValue(property_name, val);
            }
        };
        return sequelize_typescript_1.Column(column_options)(target, property_name);
    };
}
exports.ExtensibleEnumColumn = ExtensibleEnumColumn;
//# sourceMappingURL=extensible-enum-column.decorator.js.map