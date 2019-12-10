"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=relay.service.js.map