import { Scopes, Permissions } from '@rumbleship/acl';

/* default is admin only */
export const ServicePermissions = {
  QueuedSubscriptionRequest: new Permissions()
};

export const ResolverPermissions = {
  QueuedSubscriptionRequest: {
    default: Scopes.SYSADMIN
  }
};
