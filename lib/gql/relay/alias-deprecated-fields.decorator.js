"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneAndTransposeDeprecatedValues = exports.AliasFromDeprecatedField = void 0;
require("reflect-metadata");
// tslint:disable-next-line: no-circular-imports
const db_to_gql_symbol_1 = require("./../../db/transformers/db-to-gql.symbol");
const type_graphql_1 = require("type-graphql");
const AliasDeprecatedFieldMap = Symbol('AliasDeprecatedFieldMap');
/**
 *
 * @param deprecated_prop_name Name of the property to be deprecated
 * @param { FieldOptions } field_options
 *
 * @description For use in the deprecation process. This decorator wraps `@field()` from type-graphql
 * and allows several properties to be defined and exposed at an API level, all sitting on top of a
 * single one in the backend.
 *
 * @note that we explicitly redefine both the source and target properties using getters/setters
 * but to work with the TypeScript compiler into treating them as "normal" properties, they cannot be
 * defined with getters/setters in the base-attribs file:
 * `{ foo: get(): string|undefined }` and `{ foo?: string }` are treated very differently.
 */
function AliasFromDeprecatedField(deprecated_prop_name, field_options = {}) {
    return (obj, new_prop_name) => {
        var _a;
        const map = (_a = Reflect.getMetadata(AliasDeprecatedFieldMap, obj)) !== null && _a !== void 0 ? _a : new Map();
        map.set(String(deprecated_prop_name), String(new_prop_name));
        Reflect.defineMetadata(AliasDeprecatedFieldMap, map, obj);
        const shared_prop_name = `__${String(new_prop_name)}`;
        Object.defineProperty(obj, shared_prop_name, {
            writable: true
        });
        Object.defineProperty(obj, new_prop_name, {
            get() {
                return Reflect.get(obj, shared_prop_name);
            },
            set(value) {
                Reflect.set(obj, shared_prop_name, value);
            },
            configurable: true,
            enumerable: true
        });
        Object.defineProperty(obj, String(deprecated_prop_name), {
            get() {
                return Reflect.get(obj, shared_prop_name);
            },
            set(value) {
                Reflect.set(obj, shared_prop_name, value);
            },
            configurable: true,
            enumerable: true
        });
        return type_graphql_1.Field(field_options)(obj, new_prop_name);
    };
}
exports.AliasFromDeprecatedField = AliasFromDeprecatedField;
/**
 *
 * @param filterOrInputType can be Filter|Input|Update
 * CANNOT BE true true relay node object, which are very special.
 *
 * @throws Error if the passed object is a NodeRelay
 * (discriminated by presence of Symbol(modelKey)`)
 *
 * @description Remove any deprecated values from the object before it gets turned into an
 * instruction to sequelize for create/update/filter.
 *
 * @returns If any args are marked as deprecated, a **clone** of the original filter/input
 *  with the deprecated values removed, otherwise: the original object. Make sure to note that
 *  this means once this method is called on a filter/input, `instanceof` **cannot**  be guaranteed
 *  to work -- cloning removes the prototype inheritance that it relies on.
 */
function cloneAndTransposeDeprecatedValues(filterOrInputType) {
    if (Reflect.get(filterOrInputType, db_to_gql_symbol_1.modelKey)) {
        throw new Error('Cannot `cloneAndTransposeDeprecatedValues` for a relay node object.');
    }
    const map = Reflect.getMetadata(AliasDeprecatedFieldMap, filterOrInputType);
    if (map) {
        /**
         * @NOTE this is some magic! Cloning an object removes getters and setters that we inject
         * with the `@AliasFromDeprecatedField` decorator. We then ensure that only the forward-facing
         * new field is populated.
         */
        const cloned = { ...filterOrInputType };
        for (const [deprecated_field_prop_name, new_prop_name] of map.entries()) {
            const deprecated_field_val = Reflect.get(filterOrInputType, deprecated_field_prop_name);
            if (deprecated_field_val) {
                Reflect.set(cloned, new_prop_name, deprecated_field_val);
                delete cloned[deprecated_field_prop_name.toString()];
            }
        }
        return cloned;
    }
    return filterOrInputType;
}
exports.cloneAndTransposeDeprecatedValues = cloneAndTransposeDeprecatedValues;
//# sourceMappingURL=alias-deprecated-fields.decorator.js.map