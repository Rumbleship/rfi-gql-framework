import 'reflect-metadata';
import { RelayFilterBase } from './relay.interface';
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
  field_options: FieldOptions
): PropertyDecorator {
  return (obj: object, new_prop_name: symbol | string) => {
    const map: Map<string, string> =
      Reflect.getMetadata(AliasDeprecatedFieldMap, obj) ?? new Map<string, string>();
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

    return Field(field_options)(obj, new_prop_name);
  };
}

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
export function cloneAndtransposeDeprecatedValues<T extends RelayFilterBase<any>>(filter: T): T {
  const map: Map<string | symbol, string> =
    Reflect.getMetadata(AliasDeprecatedFieldMap, filter) ?? new Map<string, string>();

  /**
   * @NOTE this is some magic! Cloning an object removes getters and setters that we inject
   * with the `@AliasFromDeprecatedField` decorator. We then ensure that only the forward-facing
   * new field is populated.
   */
  const cloned = { ...filter };

  for (const [deprecated_field_prop_name, new_prop_name] of map.entries()) {
    const deprecated_field_val = Reflect.get(filter, deprecated_field_prop_name);
    Reflect.set(cloned, new_prop_name, deprecated_field_val);
    delete (cloned as any)[deprecated_field_prop_name.toString()];
  }
  return cloned;
}
