"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensibleEnumColumn = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
/**
 * Inspired by Plaid's API that considers adding values to Enums as non-breaking changes.
 *
 * We store the raw value as a string, and cast to our TypeScript/GQL Enums on retrieval from DB
 *
 * If the raw value includes spaces, we replace them with `_` on retrieval from the db
 */
function ExtensibleEnumColumn(target_enum, options = {}) {
    if (!Reflect.get(target_enum, 'UNKNOWN')) {
        throw new Error('Enum passed to `ExtensibleEnumColumn` must contain an value `UNKNOWN = UKNOWN`');
    }
    const decorator = (target, property_name) => {
        const column_options = {
            type: sequelize_typescript_1.DataType.STRING,
            get() {
                const raw = this.getDataValue(property_name);
                if (options.allowNull && !raw) {
                    return undefined;
                }
                const val = raw === null || raw === void 0 ? void 0 : raw.replace(/ /g, '_');
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
    return decorator;
}
exports.ExtensibleEnumColumn = ExtensibleEnumColumn;
//# sourceMappingURL=extensible-enum-column.decorator.js.map