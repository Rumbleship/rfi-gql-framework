"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const helpers_1 = require("../../helpers");
function convertToSequelizeEnum(toConvert, options) {
    let enumValues = helpers_1.enumAsStrings(toConvert);
    if (options) {
        enumValues = enumValues.filter((value) => {
            return !options.exclude.includes(value);
        });
    }
    return sequelize_typescript_1.DataType.ENUM(...enumValues);
}
exports.convertToSequelizeEnum = convertToSequelizeEnum;
//# sourceMappingURL=convert-to-sequelize-enum.js.map