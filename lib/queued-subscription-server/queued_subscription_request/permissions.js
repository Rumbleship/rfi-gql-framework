"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolverPermissions = exports.ServicePermissions = void 0;
const acl_1 = require("@rumbleship/acl");
/* default is admin only */
exports.ServicePermissions = {
    QueuedSubscriptionRequest: new acl_1.Permissions(),
    Webhook: new acl_1.Permissions()
};
exports.ResolverPermissions = {
    QueuedSubscriptionRequest: {
        default: acl_1.Scopes.SYSADMIN
    },
    Webhook: {
        default: [acl_1.Scopes.SYSADMIN, acl_1.Scopes.API_KEY]
    }
};
//# sourceMappingURL=permissions.js.map