"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acl_1 = require("@rumbleship/acl");
exports.RFIAuthChecker = ({ root, args, context, info }, permissionsOrScopeList) => {
    const authorizer = context.authorizer;
    const { operation } = info.operation;
    if (!root) {
        // resolver level permissioning
        return authorizer.inScope(permissionsOrScopeList);
    }
    // attribute level, through the resolver, permissioning
    const selection = info.operation.selectionSet.selections[0];
    const action = operation === acl_1.Actions.QUERY
        ? acl_1.Actions.QUERY
        : selection.name && selection.name.value.match(/^update/)
            ? acl_1.Actions.UPDATE
            : acl_1.Actions.CREATE;
    return authorizer.can(action, root, permissionsOrScopeList);
};
//# sourceMappingURL=auth-checker.js.map