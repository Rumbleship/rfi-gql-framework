"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQLEdge = void 0;
const type_graphql_1 = require("type-graphql");
const attrib_enum_1 = require("./attrib.enum");
const relay_interface_1 = require("./relay.interface");
const base_attribs_builder_1 = require("./base-attribs.builder");
function GQLEdge(TEdge, attribType = attrib_enum_1.AttribType.Obj) {
    let GQLEdgeClass = class GQLEdgeClass extends relay_interface_1.Edge {
    };
    __decorate([
        type_graphql_1.Field(type => TEdge),
        __metadata("design:type", Object)
    ], GQLEdgeClass.prototype, "node", void 0);
    __decorate([
        type_graphql_1.Field(),
        __metadata("design:type", String)
    ], GQLEdgeClass.prototype, "cursor", void 0);
    GQLEdgeClass = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(attribType)
    ], GQLEdgeClass);
    return GQLEdgeClass;
}
exports.GQLEdge = GQLEdge;
//# sourceMappingURL=edge.builder.js.map