import { Oid } from '@rumbleship/oid';
/**
 * MUST be called at the beginning of the bootstrap process before any of the queued subscription
 * code is called
 * @param service_name Name to use to prefix the GraphQl schema types
 */
export declare function init_queued_subscription_relay(service_name: string, service_short_code: string, queued_subscription_request_scope_name?: string): void;
export declare function getRelayPrefix(): string;
export declare function getRelayPrefixLowerCase(): string;
export declare function getServiceShortCode(): string;
export declare function getQueuedSubscriptionRequestScopeName(): string;
export declare function isQeuedSubscriptionOidForThisService(oid: Oid): boolean;
