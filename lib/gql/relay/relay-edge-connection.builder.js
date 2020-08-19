"use strict";
/**
 * Upgrades the GQLEdge to support typegraphql interface mechanism in release candidate 1.0.0rc2 and correctly allow for
 * mapping the implementatio of a base class for a relay object with the interface class used by the graphql type sytem
 */
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
exports.buildConnectionClass = exports.buildEdgeClass = void 0;
const type_graphql_1 = require("type-graphql");
const relay_interface_1 = require("./relay.interface");
const attrib_enum_1 = require("./attrib.enum");
const base_attribs_builder_1 = require("./base-attribs.builder");
const page_info_type_1 = require("./page-info.type");
/**
 * @see https://facebook.github.io/relay/graphql/connections.htm
 *
 * We have to derive a concrete class for Connections, as the typescript introspection
 * isnt good enougth with generics ( ie the abstract edges cant be decorated successfully as a
 * graphQL field)...but we can still pull up common beviours to this abstract
 * class
 */
/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
function buildEdgeClass(options) {
    const { RelayClass, SchemaClass, schemaType } = options;
    const GqlType = SchemaClass !== null && SchemaClass !== void 0 ? SchemaClass : RelayClass;
    let RelayEdgeClass = class RelayEdgeClass extends relay_interface_1.Edge {
    };
    __decorate([
        type_graphql_1.Field(type => GqlType),
        __metadata("design:type", Object)
    ], RelayEdgeClass.prototype, "node", void 0);
    __decorate([
        type_graphql_1.Field(),
        __metadata("design:type", String)
    ], RelayEdgeClass.prototype, "cursor", void 0);
    RelayEdgeClass = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(schemaType !== null && schemaType !== void 0 ? schemaType : attrib_enum_1.AttribType.Obj)
    ], RelayEdgeClass);
    return RelayEdgeClass;
}
exports.buildEdgeClass = buildEdgeClass;
/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
function buildConnectionClass(options) {
    const { EdgeClass, SchemaClass, schemaType } = options;
    const GqlType = SchemaClass !== null && SchemaClass !== void 0 ? SchemaClass : EdgeClass;
    let RelayConnectionClass = class RelayConnectionClass extends relay_interface_1.Connection {
        constructor() {
            super(...arguments);
            this.pageInfo = new page_info_type_1.PageInfo();
        }
        addEdges(edges, hasNextPage, hasPreviousPage) {
            super.addEdges(edges, hasNextPage, hasPreviousPage);
        }
    };
    __decorate([
        type_graphql_1.Field(type => page_info_type_1.PageInfo),
        __metadata("design:type", page_info_type_1.PageInfo)
    ], RelayConnectionClass.prototype, "pageInfo", void 0);
    __decorate([
        type_graphql_1.Field(type => GqlType),
        __metadata("design:type", Array)
    ], RelayConnectionClass.prototype, "edges", void 0);
    RelayConnectionClass = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(schemaType !== null && schemaType !== void 0 ? schemaType : attrib_enum_1.AttribType.Obj)
    ], RelayConnectionClass);
    return RelayConnectionClass;
}
exports.buildConnectionClass = buildConnectionClass;
//# sourceMappingURL=relay-edge-connection.builder.js.map