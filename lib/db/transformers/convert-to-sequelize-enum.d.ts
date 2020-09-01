import { EnumDataType } from 'sequelize/types';
export declare function convertToSequelizeEnum<TEnum extends Record<string, any>>(toConvert: TEnum, options?: {
    exclude: string[];
}): EnumDataType<string>;
