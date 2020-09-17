"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolverPermissions = exports.ServicePermissions = void 0;
const acl_1 = require("@rumbleship/acl");
/* default is admin only */
exports.ServicePermissions = {
    QueuedSubscriptionRequest: new acl_1.Permissions(),
    Webhook: new acl_1.Permissions()
};
exports.ServicePermissions.QueuedSubscriptionRequest.allow({
    role: acl_1.Roles.USER,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.QUERY
});
exports.ServicePermissions.QueuedSubscriptionRequest.allow({
    role: acl_1.Roles.ADMIN,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.QUERY
});
exports.ServicePermissions.QueuedSubscriptionRequest.allow({
    role: acl_1.Roles.ADMIN,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.CREATE
});
exports.ServicePermissions.Webhook.allow({
    role: acl_1.Roles.USER,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.QUERY
});
exports.ServicePermissions.Webhook.allow({
    role: acl_1.Roles.ADMIN,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.QUERY
});
exports.ServicePermissions.Webhook.allow({
    role: acl_1.Roles.ADMIN,
    at: acl_1.Resource.Division,
    to: acl_1.Actions.CREATE
});
exports.ResolverPermissions = {
    QueuedSubscriptionRequest: {
        default: [acl_1.Scopes.SYSADMIN, acl_1.Scopes.API_KEY]
    },
    Webhook: {
        default: [acl_1.Scopes.SYSADMIN, acl_1.Scopes.API_KEY]
    }
};
//# sourceMappingURL=permissions.js.map