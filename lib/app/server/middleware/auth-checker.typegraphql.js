"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFIAuthChecker = void 0;
const acl_1 = require("@rumbleship/acl");
exports.RFIAuthChecker = ({ root, args, context, info }, permissionsOrScopeList) => {
    // Question #1 ("Do I exist?" has been answered; we have an authenticated Authorizer
    const authorizer = context.authorizer;
    if (permissionsOrScopeList[0] instanceof acl_1.Permissions) {
        // Question #3 ("Can I ask this specific question") has been answered by DB/authorizer
        //  integration in the sequelize-base-service, so we can...
        // Answer Question #4: "Do I have the rights to read whatever I'm asking for?"
        return authorizer.can(acl_1.Actions.QUERY, root, permissionsOrScopeList[0], acl_1.getAuthorizerTreatAs(root, false));
    }
    // Answer Question #2: "Do I have the rights to ask this kind of -question?"
    // if (!root) {
    // resolver level permissioning
    return authorizer.inScope(permissionsOrScopeList);
    // }
};
//# sourceMappingURL=auth-checker.typegraphql.js.map