import { DataType } from 'sequelize-typescript';
import { EnumDataType } from 'sequelize/types';
import { enumAsStrings } from '../../helpers';

export function convertToSequelizeEnum<TEnum extends Record<string, any>>(
  toConvert: TEnum,
  options?: { exclude: string[] }
): EnumDataType<string> {
  let enumValues = enumAsStrings(toConvert);
  if (options) {
    enumValues = enumValues.filter((value: string) => {
      return !options.exclude.includes(value);
    });
  }
  return DataType.ENUM(...enumValues);
}
