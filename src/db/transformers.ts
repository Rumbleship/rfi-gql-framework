import { enumAsStrings } from '../helpers/index';
import { DataType } from 'sequelize-typescript';

export function convertToSequelizeEnum<TEnum extends object>(
  toConvert: TEnum,
  options?: { exclude: string[] }
) {
  let enumValues = enumAsStrings(toConvert);
  if (options) {
    enumValues = enumValues.filter((value: string) => {
      return !options.exclude.includes(value);
    });
  }
  return DataType.ENUM(...enumValues);
}
