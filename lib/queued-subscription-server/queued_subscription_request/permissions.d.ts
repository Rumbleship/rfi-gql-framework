import { Scopes, Permissions } from '@rumbleship/acl';
export declare const ServicePermissions: {
    QueuedSubscriptionRequest: Permissions;
    Webhook: Permissions;
};
export declare const ResolverPermissions: {
    QueuedSubscriptionRequest: {
        default: Scopes[];
    };
    Webhook: {
        default: Scopes[];
    };
};
