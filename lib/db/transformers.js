"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const index_1 = require("../gql/index");
const enumAsStrings_1 = require("../helpers/enumAsStrings");
// Creates a new Object of type T and fills it with the plain proerties of the Sequelize Model
// It is a SHALLOW copy...
exports.modelKey = Symbol.for('model');
exports.apiKey = Symbol.for('api');
function modelToClass(nodeService, to, from) {
    const modelAsPlain = from.get({ plain: true });
    // Have we already done this transforation?
    if (exports.apiKey in from) {
        return Reflect.get(from, exports.apiKey);
    }
    const obj = Object.assign(new to(), modelAsPlain);
    const oid = index_1.Oid.create(obj.constructor['name'], modelAsPlain.uuid ? modelAsPlain.uuid : String(modelAsPlain.id));
    obj.id = oid;
    obj._service = nodeService;
    // store for future use
    Reflect.set(obj, exports.modelKey, from);
    Reflect.set(from, exports.apiKey, obj);
    return obj;
}
exports.modelToClass = modelToClass;
async function reloadNodeFromModel(node, fromDb = true) {
    if (exports.modelKey in node) {
        const model = Reflect.get(node, exports.apiKey);
        if (fromDb) {
            await model.reload();
        }
        const modelAsPlain = model.get({ plain: true });
        delete modelAsPlain.id;
        Object.assign(node, modelAsPlain);
    }
    return node;
}
exports.reloadNodeFromModel = reloadNodeFromModel;
function convertToSequelizeEnum(toConvert, options) {
    let enumValues = enumAsStrings_1.enumAsStrings(toConvert);
    if (options) {
        enumValues = enumValues.filter((value) => {
            return !options.exclude.includes(value);
        });
    }
    return sequelize_typescript_1.DataType.ENUM(...enumValues);
}
exports.convertToSequelizeEnum = convertToSequelizeEnum;
//# sourceMappingURL=transformers.js.map