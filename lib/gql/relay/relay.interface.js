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
exports.Connection = exports.Edge = exports.Node = exports.NodeServiceTransactionType = exports.NodeServiceIsolationLevel = exports.NodeServiceLock = void 0;
const type_graphql_1 = require("type-graphql");
const oid_1 = require("@rumbleship/oid");
const page_info_type_1 = require("./page-info.type");
var NodeServiceLock;
(function (NodeServiceLock) {
    NodeServiceLock["UPDATE"] = "UPDATE";
    NodeServiceLock["SHARE"] = "SHARE";
})(NodeServiceLock = exports.NodeServiceLock || (exports.NodeServiceLock = {}));
var NodeServiceIsolationLevel;
(function (NodeServiceIsolationLevel) {
    NodeServiceIsolationLevel["READ_UNCOMMITTED"] = "READ UNCOMMITTED";
    NodeServiceIsolationLevel["READ_COMMITTED"] = "READ COMMITTED";
    NodeServiceIsolationLevel["REPEATABLE_READ"] = "REPEATABLE READ";
    NodeServiceIsolationLevel["SERIALIZABLE"] = "SERIALIZABLE";
})(NodeServiceIsolationLevel = exports.NodeServiceIsolationLevel || (exports.NodeServiceIsolationLevel = {}));
var NodeServiceTransactionType;
(function (NodeServiceTransactionType) {
    NodeServiceTransactionType["DEFERRED"] = "DEFERRED";
    NodeServiceTransactionType["IMMEDIATE"] = "IMMEDIATE";
    NodeServiceTransactionType["EXCLUSIVE"] = "EXCLUSIVE";
})(NodeServiceTransactionType = exports.NodeServiceTransactionType || (exports.NodeServiceTransactionType = {}));
let Node = class Node {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID),
    __metadata("design:type", oid_1.Oid)
], Node.prototype, "id", void 0);
Node = __decorate([
    type_graphql_1.InterfaceType({ isAbstract: true })
], Node);
exports.Node = Node;
class Edge {
}
exports.Edge = Edge;
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
//# sourceMappingURL=relay.interface.js.map