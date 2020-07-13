import 'reflect-metadata';
import { FieldOptions, Field } from 'type-graphql';

// export const AliasDeprecatedFieldSource = Symbol('AliasDeprecatedFieldSource');
// export const AliasDeprecatedFieldTarget = Symbol('AliasDeprecatedFieldTarget');
const AliasDeprecatedFieldMap = Symbol('AliasDeprecatedFieldMap');
export function AliasDeprecatedField(
  new_prop_name: string,
  field_options: FieldOptions = {}
): PropertyDecorator {
  return (obj: object, deprecated_field_prop_name: string | symbol) => {
    const map: Map<string | symbol, string> =
      Reflect.getMetadata(AliasDeprecatedFieldMap, obj) ?? new Map<string | symbol, string>();
    map.set(deprecated_field_prop_name, new_prop_name);
    if (!field_options.deprecationReason) {
      field_options.deprecationReason = `Deprecated in favor of \`${new_prop_name}\``;
    }
    Reflect.defineMetadata(AliasDeprecatedFieldMap, map, obj);
    // Object.defineProperty(obj, new_prop_name, { get: val => Reflect.get() });
    Field(field_options)(obj, deprecated_field_prop_name);
  };
}

export function AliasFromDeprecatedField(
  deprecated_prop_name: symbol | string,
  field_options: FieldOptions
): PropertyDecorator {
  return (obj: object, new_prop_name: symbol | string) => {
    // Copy values from old+new values to internal, "private" properties.
    Object.defineProperty(obj, `__${String(new_prop_name)}`, Reflect.get(obj, new_prop_name));
    Object.defineProperty(
      obj,
      `__${String(deprecated_prop_name)}`,
      Reflect.get(obj, deprecated_prop_name)
    );

    // Replace new prop with getter that reads from private new-prop, else private old-prop
    // Setter sets private new-prop
    Object.defineProperty(obj, new_prop_name, {
      get() {
        const val_from_deprecated_prop = Reflect.get(obj, `__${String(deprecated_prop_name)}`);
        const new_value = Reflect.get(obj, `__${String(new_prop_name)}`);
        return new_value ?? val_from_deprecated_prop;
      },
      set(val) {
        Reflect.set(obj, `__${String(new_prop_name)}`, val);
      }
    });
    Object.defineProperty(obj, deprecated_prop_name, {
      get() {
        return Reflect.get(obj, `__${String(deprecated_prop_name)}`);
      },
      set(val) {
        // If new prop isn't in use, when setting deprecated prop, set new prop as well
        if (!Reflect.get(obj, `__${String(new_prop_name)}`)) {
          Reflect.set(obj, `__${String(new_prop_name)}`, val);
        }
        Reflect.set(obj, `__${String(deprecated_prop_name)}`, val);
      }
    });

    return Field(field_options)(obj, new_prop_name);
  };
}

export function TransposeDeprecatedFields(): ParameterDecorator {
  return (obj: object, property_name: string | symbol, index: number) => {
    const map: Map<string | symbol, string> =
      Reflect.getMetadata(AliasDeprecatedFieldMap, obj) ?? new Map<string, string>();
    for (const [deprecated_field_prop_name, new_prop_name] of map.entries()) {
      const deprecated_field_val = Reflect.get(obj, deprecated_field_prop_name);
      Reflect.set(obj, new_prop_name, deprecated_field_val);
    }
  };
}

