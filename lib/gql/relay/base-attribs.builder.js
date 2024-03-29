"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInputOrObject = exports.GqlBaseAttribs = void 0;
const type_graphql_1 = require("type-graphql");
const attrib_enum_1 = require("./attrib.enum");
// tslint:disable-next-line: ban-types
function GqlBaseAttribs(attribType) {
    // tslint:disable-next-line: only-arrow-functions
    return function (target) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const clazz = target;
        switch (attribType) {
            case attrib_enum_1.AttribType.Input:
            case attrib_enum_1.AttribType.Update:
                return type_graphql_1.InputType({ isAbstract: true })(clazz);
            case attrib_enum_1.AttribType.Obj:
                return type_graphql_1.ObjectType({ isAbstract: true })(clazz);
            case attrib_enum_1.AttribType.Arg:
                return type_graphql_1.ArgsType()(clazz);
            case attrib_enum_1.AttribType.Interface:
                return type_graphql_1.InterfaceType({ isAbstract: true })(clazz);
        }
        return clazz;
    };
}
exports.GqlBaseAttribs = GqlBaseAttribs;
function isInputOrObject(attribType) {
    return (attribType === attrib_enum_1.AttribType.Input ||
        attribType === attrib_enum_1.AttribType.Obj ||
        attribType === attrib_enum_1.AttribType.Interface);
}
exports.isInputOrObject = isInputOrObject;
// name to base-attribs.ts
//# sourceMappingURL=base-attribs.builder.js.map