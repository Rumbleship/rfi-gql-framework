import { Oid } from '@rumbleship/oid';
import { ISharedSchema } from '@rumbleship/config';
/**
 * MUST be called at the beginning of the bootstrap process before any of the queued subscription
 * code is called
 *
 * These functions are kept as top level functions as they are used across the various layers
 * in our architecture, and so we dont want to have them as, for example, statics on QueuedSubscriptionServer
 * as that could cause some nasty unneccessary circular debendancies
 *
 * @param service_name Name to use to prefix the GraphQl schema types
 *
 *
 */
export declare function inititializeQueuedSubscriptionRelay(config: ISharedSchema, queued_subscription_request_scope_name?: string): void;
export declare function getRelayPrefix(): string;
export declare function getRelayPrefixLowerCase(): string;
export declare function getServiceShortCode(): string;
export declare function getQueuedSubscriptionRequestScopeName(): string;
export declare function isQeuedSubscriptionOidForThisService(oid: Oid): boolean;
