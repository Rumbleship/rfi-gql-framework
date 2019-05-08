"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attrib_enum_1 = require("./attrib.enum");
const type_graphql_1 = require("type-graphql");
// tslint:disable-next-line: ban-types
function GqlBaseAttribs(attribType) {
    // tslint:disable-next-line: only-arrow-functions
    return function (target) {
        // tslint:disable-next-line: ban-types
        const clazz = target;
        switch (attribType) {
            case attrib_enum_1.AttribType.Input:
            case attrib_enum_1.AttribType.Update:
                return type_graphql_1.InputType({ isAbstract: true })(clazz);
            case attrib_enum_1.AttribType.Obj:
                return type_graphql_1.ObjectType({ isAbstract: true })(clazz);
            case attrib_enum_1.AttribType.Arg:
                return type_graphql_1.ArgsType()(clazz);
        }
        return clazz;
    };
}
exports.GqlBaseAttribs = GqlBaseAttribs;
function isInputOrObject(attribType) {
    return attribType === attrib_enum_1.AttribType.Input || attribType === attrib_enum_1.AttribType.Obj;
}
exports.isInputOrObject = isInputOrObject;
//# sourceMappingURL=gql_helpers.js.map