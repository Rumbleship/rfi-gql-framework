"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransposeDeprecatedFields = exports.AliasDeprecatedField = void 0;
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
        return type_graphql_1.Field(field_options)(obj, deprecated_field_prop_name);
    };
}
exports.AliasDeprecatedField = AliasDeprecatedField;
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