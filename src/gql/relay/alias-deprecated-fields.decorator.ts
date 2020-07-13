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
    const map = Reflect.getMetadata(AliasDeprecatedFieldMap, obj) ?? new Map<string, string>();
    map.set(deprecated_field_prop_name, new_prop_name);
    if (!field_options.deprecationReason) {
      field_options.deprecationReason = `Deprecated in favor of \`${new_prop_name}\``;
    }
    return Field(field_options)(obj, deprecated_field_prop_name);
  };
}

export function TransposeDeprecatedFields(): ParameterDecorator {
  return (obj: object, property_name: string | symbol, index: number) => {
    const map = Reflect.getMetadata(AliasDeprecatedFieldMap, obj);
    for (const [deprecated_field_prop_name, new_prop_name] of map.entries()) {
      const deprecated_field_val = Reflect.get(obj, deprecated_field_prop_name);
      Reflect.set(obj, new_prop_name, deprecated_field_val);
    }
  };
}
