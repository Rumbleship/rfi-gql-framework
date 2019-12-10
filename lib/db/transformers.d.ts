export declare function convertToSequelizeEnum<TEnum extends object>(toConvert: TEnum, options?: {
    exclude: string[];
}): import("sequelize/types").EnumDataType<string>;
