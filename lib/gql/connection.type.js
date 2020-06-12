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
exports.GQLConnection = exports.Connection = void 0;
const page_info_type_1 = require("./page-info.type");
const type_graphql_1 = require("type-graphql");
const attrib_enum_1 = require("./attrib.enum");
const gql_helpers_1 = require("./gql_helpers");
// see https://facebook.github.io/relay/graphql/connections.htm
// We have to derive a concrete class for Connections, as the typescript introspection
// isnt good enogth with generics ( ie the abstract edges cant be decorated successfully as a
// graphQL field)...but we can still pull up common beviours to this abstract
// class
class Connection {
    constructor() {
        this.pageInfo = new page_info_type_1.PageInfo();
    }
    addEdges(edges, hasNextPage, hasPreviousPage) {
        if (edges.length === 0) {
            this.pageInfo.setInfo(hasNextPage, hasPreviousPage);
        }
        else {
            this.pageInfo.setInfo(hasNextPage, hasPreviousPage, edges[0].cursor, edges[edges.length - 1].cursor);
        }
        this.edges = edges;
        return;
    }
}
exports.Connection = Connection;
function GQLConnection(TClass, TEdgeClass, attribType = attrib_enum_1.AttribType.Obj) {
    let GQLConnectionClass = class GQLConnectionClass extends Connection {
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
    ], GQLConnectionClass.prototype, "pageInfo", void 0);
    __decorate([
        type_graphql_1.Field(type => TEdgeClass),
        __metadata("design:type", Array)
    ], GQLConnectionClass.prototype, "edges", void 0);
    GQLConnectionClass = __decorate([
        gql_helpers_1.GqlBaseAttribs(attribType)
    ], GQLConnectionClass);
    return GQLConnectionClass;
}
exports.GQLConnection = GQLConnection;
//# sourceMappingURL=connection.type.js.map