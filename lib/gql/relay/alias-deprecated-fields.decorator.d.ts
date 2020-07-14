import 'reflect-metadata';
import { RelayFilterBase } from './relay.interface';
import { FieldOptions } from 'type-graphql';
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
export declare function AliasFromDeprecatedField<T, K = keyof T>(deprecated_prop_name: K, field_options: FieldOptions): PropertyDecorator;
/**
 *
 * @param filter can be Filter|Input|Update
 * CANNOT BE true true relay node object, which are very special.
 *
 * @description Remove any deprecated values from the object before it gets turned into an
 * instruction to sequelize for create/update/filter.
 *
 * @returns A **clone** of the original filter/input with the deprecated values removed
 */
export declare function cloneAndtransposeDeprecatedValues<T extends RelayFilterBase<any>>(filter: T): T;
