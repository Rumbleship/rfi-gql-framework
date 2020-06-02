import { DataType, Column } from 'sequelize-typescript';
import { ModelAttributeColumnOptions } from 'sequelize';
/**
 * Inspired by Plaid's API that considers adding values to Enums as non-breaking changes.
 *
 * We store the raw value as a string, and cast to our TypeScript/GQL Enums on retrieval from DB
 */
export function ExtensibleEnumColumn<T extends object>(
  target_enum: T,
  options: Pick<ModelAttributeColumnOptions, 'allowNull'> &
    Pick<ModelAttributeColumnOptions, 'defaultValue'> = {}
) {
  if (!Reflect.get(target_enum, 'UNKNOWN')) {
    throw new Error(
      'Enum passed to `ExtensibleEnumColumn` must contain an value `UNKNOWN = UKNOWN`'
    );
  }
  return (target: object, property_name: string): any => {
    const column_options = {
      type: DataType.STRING,
      get(this: any): T | undefined {
        const val = this.getDataValue(property_name);
        if (options.allowNull && !val) {
          return undefined;
        }
        if (val in target_enum) {
          return (val as unknown) as T;
        }
        return Reflect.get(target_enum, 'UNKNOWN') as T;
      },
      set(this: any, val?: T) {
        this.setDataValue(property_name, val);
      }
    };

    return Column(column_options)(target, property_name);
  };
}
