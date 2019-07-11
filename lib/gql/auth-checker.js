"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFIAuthChecker = ({ root, args, context, info }, permissionsOrScopeList) => {
    const authorizer = context.authorizer;
    const { operation } = info.operation;
    if (!root) {
        // resolver level permissioning
        return authorizer.inScope(permissionsOrScopeList);
    }
    // attribute level, through the resolver, permissioning
    return authorizer.can(operation, root, permissionsOrScopeList);
};
//# sourceMappingURL=auth-checker.js.map