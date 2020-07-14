import 'reflect-metadata';
import { RelayFilterBase, RelayInputTypeBase } from './relay.interface';
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
export declare function AliasFromDeprecatedField<T, K = keyof T>(deprecated_prop_name: K, field_options?: FieldOptions): PropertyDecorator;
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
export declare function cloneAndTransposeDeprecatedValues<T extends RelayFilterBase<any> | RelayInputTypeBase<any>>(filterOrInputType: T): T;
