import { Scopes, Permissions } from '@rumbleship/acl';

/* default is admin only */
export const ServicePermissions = {
  QueuedSubscriptionRequest: new Permissions(),
  Webhook: new Permissions()
};

export const ResolverPermissions = {
  QueuedSubscriptionRequest: {
    default: Scopes.SYSADMIN
  },
  Webhook: {
    default: [Scopes.SYSADMIN, Scopes.API_KEY]
  }
};
