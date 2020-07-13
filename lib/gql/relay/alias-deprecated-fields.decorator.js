"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransposeDeprecatedFields = exports.AliasFromDeprecatedField = exports.AliasDeprecatedField = void 0;
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
// export const AliasDeprecatedFieldSource = Symbol('AliasDeprecatedFieldSource');
// export const AliasDeprecatedFieldTarget = Symbol('AliasDeprecatedFieldTarget');
const AliasDeprecatedFieldMap = Symbol('AliasDeprecatedFieldMap');
function AliasDeprecatedField(new_prop_name, field_options = {}) {
    return (obj, deprecated_field_prop_name) => {
        var _a;
        const map = (_a = Reflect.getMetadata(AliasDeprecatedFieldMap, obj)) !== null && _a !== void 0 ? _a : new Map();
        map.set(deprecated_field_prop_name, new_prop_name);
        if (!field_options.deprecationReason) {
            field_options.deprecationReason = `Deprecated in favor of \`${new_prop_name}\``;
        }
        Reflect.defineMetadata(AliasDeprecatedFieldMap, map, obj);
        // Object.defineProperty(obj, new_prop_name, { get: val => Reflect.get() });
        type_graphql_1.Field(field_options)(obj, deprecated_field_prop_name);
    };
}
exports.AliasDeprecatedField = AliasDeprecatedField;
function AliasFromDeprecatedField(deprecated_prop_name, field_options) {
    return (obj, new_prop_name) => {
        // Copy values from old+new values to internal, "private" properties.
        const original_new_val = Reflect.get(obj, new_prop_name);
        const original_deprecated_val = Reflect.get(obj, deprecated_prop_name);
        Object.defineProperty(obj, `__${String(new_prop_name)}`, {
            value: original_new_val
        });
        Object.defineProperty(obj, `__${String(deprecated_prop_name)}`, {
            value: original_deprecated_val
        });
        // Replace new prop with getter that reads from private new-prop, else private old-prop
        // Setter sets private new-prop
        Object.defineProperty(obj, new_prop_name, {
            get() {
                const val_from_deprecated_prop = Reflect.get(obj, `__${String(deprecated_prop_name)}`);
                const new_value = Reflect.get(obj, `__${String(new_prop_name)}`);
                return new_value !== null && new_value !== void 0 ? new_value : val_from_deprecated_prop;
            },
            set(value) {
                Object.defineProperty(obj, `__${String(new_prop_name)}`, { value });
            }
        });
        Object.defineProperty(obj, deprecated_prop_name, {
            get() {
                return Reflect.get(obj, `__${String(deprecated_prop_name)}`);
            },
            set(value) {
                // If new prop isn't in use, when setting deprecated prop, set new prop as well
                if (!Reflect.get(obj, `__${String(new_prop_name)}`)) {
                    Object.defineProperty(obj, `__${String(new_prop_name)}`, { value });
                }
                if (!Reflect.get(obj, `__${String(deprecated_prop_name)}`)) {
                    Object.defineProperty(obj, `__${String(deprecated_prop_name)}`, { value });
                }
            }
        });
        return type_graphql_1.Field(field_options)(obj, new_prop_name);
    };
}
exports.AliasFromDeprecatedField = AliasFromDeprecatedField;
function TransposeDeprecatedFields() {
    return (obj, property_name, index) => {
        var _a;
        const map = (_a = Reflect.getMetadata(AliasDeprecatedFieldMap, obj)) !== null && _a !== void 0 ? _a : new Map();
        for (const [deprecated_field_prop_name, new_prop_name] of map.entries()) {
            const deprecated_field_val = Reflect.get(obj, deprecated_field_prop_name);
            Reflect.set(obj, new_prop_name, deprecated_field_val);
        }
    };
}
exports.TransposeDeprecatedFields = TransposeDeprecatedFields;
//# sourceMappingURL=alias-deprecated-fields.decorator.js.map