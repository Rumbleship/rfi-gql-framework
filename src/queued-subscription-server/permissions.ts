import { Scopes, Permissions, Roles, Resource, Actions } from '@rumbleship/acl';

/* default is admin only */
export const ServicePermissions = {
  QueuedSubscriptionRequest: new Permissions(),
  Webhook: new Permissions()
};

ServicePermissions.QueuedSubscriptionRequest.allow({
  role: Roles.USER,
  at: Resource.Division,
  to: Actions.QUERY
});
ServicePermissions.QueuedSubscriptionRequest.allow({
  role: Roles.ADMIN,
  at: Resource.Division,
  to: Actions.QUERY
});
ServicePermissions.QueuedSubscriptionRequest.allow({
  role: Roles.ADMIN,
  at: Resource.Division,
  to: Actions.CREATE
});

ServicePermissions.Webhook.allow({
  role: Roles.USER,
  at: Resource.Division,
  to: Actions.QUERY
});
ServicePermissions.Webhook.allow({
  role: Roles.ADMIN,
  at: Resource.Division,
  to: Actions.QUERY
});
ServicePermissions.Webhook.allow({
  role: Roles.ADMIN,
  at: Resource.Division,
  to: Actions.CREATE
});

export const ResolverPermissions = {
  QueuedSubscriptionRequest: {
    default: [Scopes.SYSADMIN, Scopes.API_KEY]
  },
  Webhook: {
    default: [Scopes.SYSADMIN, Scopes.API_KEY]
  }
};
