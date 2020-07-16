import 'reflect-metadata';
// tslint:disable-next-line: no-circular-imports
import { modelKey } from './../../db/transformers/db-to-gql.symbol';
import { RelayFilterBase, RelayInputTypeBase } from './relay.interface';
import { FieldOptions, Field } from 'type-graphql';

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
export function AliasFromDeprecatedField<T, K = keyof T>(
  deprecated_prop_name: K,
  field_options: FieldOptions = {}
): PropertyDecorator {
  return (target_class: object, new_prop_name: symbol | string) => {
    const map: Map<string, string> =
      Reflect.getMetadata(AliasDeprecatedFieldMap, target_class) ?? new Map<string, string>();
    map.set(String(deprecated_prop_name), String(new_prop_name));
    Reflect.defineMetadata(AliasDeprecatedFieldMap, map, target_class);
    const shared_prop_name = `__${String(new_prop_name)}`;
    Object.defineProperty(target_class, shared_prop_name, {
      writable: true
    });
    Object.defineProperty(target_class, new_prop_name, {
      get() {
        return Reflect.get(this, shared_prop_name);
      },
      set(value) {
        Reflect.set(this, shared_prop_name, value);
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(target_class, String(deprecated_prop_name), {
      get() {
        return Reflect.get(this, shared_prop_name);
      },
      set(value) {
        Reflect.set(this, shared_prop_name, value);
      },
      configurable: true,
      enumerable: true
    });

    return Field(field_options)(target_class, new_prop_name);
  };
}

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
export function cloneAndTransposeDeprecatedValues<
  T extends RelayFilterBase<any> | RelayInputTypeBase<any>
>(filterOrInputType: T): T {
  if (Reflect.get(filterOrInputType, modelKey)) {
    throw new Error('Cannot `cloneAndTransposeDeprecatedValues` for a relay node object.');
  }
  const map: Map<string | symbol, string> = Reflect.getMetadata(
    AliasDeprecatedFieldMap,
    filterOrInputType
  );

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
        delete (cloned as any)[deprecated_field_prop_name.toString()];
      }
    }
    return cloned;
  }
  return filterOrInputType;
}
