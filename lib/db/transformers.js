"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../helpers/index");
const sequelize_typescript_1 = require("sequelize-typescript");
function convertToSequelizeEnum(toConvert, options) {
    let enumValues = index_1.enumAsStrings(toConvert);
    if (options) {
        enumValues = enumValues.filter((value) => {
            return !options.exclude.includes(value);
        });
    }
    return sequelize_typescript_1.DataType.ENUM(...enumValues);
}
exports.convertToSequelizeEnum = convertToSequelizeEnum;
//# sourceMappingURL=transformers.js.map