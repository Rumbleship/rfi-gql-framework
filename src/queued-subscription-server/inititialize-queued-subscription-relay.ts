import { capitalize, lowerFirst } from 'lodash';
import { Oid } from '@rumbleship/oid';
import { ISharedSchema } from '@rumbleship/config';
import Container from 'typedi';

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
export function inititializeQueuedSubscriptionRelay(
  config: ISharedSchema,
  queued_subscription_request_scope_name = 'QueuedSubscriptionRequest',
  webhook_scope_name = 'Webhook'
): void {
  setServiceName(config.serviceName, config.serviceShortCode);

  // each microservice that uses the queuedSubscriptionSerer, must locally register its own scope short code
  // it is a little confusing, but is necessary to allow for properly federated/stiched schemas at the
  // distributed architecture level.
  //
  Oid.RegisterScope(queued_subscription_request_scope_name, `${config.serviceShortCode}.qsr`);
  Oid.RegisterScope(webhook_scope_name, `${config.serviceShortCode}.wh`);
  setQueuedSubscriptionRequestScopeName(queued_subscription_request_scope_name);
  setWebhookScopeName(webhook_scope_name);
}

let _the_service_name: string;
let _the_service_short_code: string;
let _queued_subscription_request_scope_name: string;
let _webhook_scope_name: string;

// todo refactor out when qsr is central service

export function getRelayPrefix(): string {
  const webhookAndQSRPrefix = Container.get<string>('WebhookAndQSRPrefix');
  if (webhookAndQSRPrefix) {
    return webhookAndQSRPrefix;
  } else {
    return capitalize(_the_service_name ?? '');
  }
}
export function getRelayPrefixLowerCase(): string {
  return lowerFirst(getRelayPrefix());
}
export function getServiceShortCode(): string {
  return _the_service_short_code;
}

export function getQueuedSubscriptionRequestScopeName(): string {
  return _queued_subscription_request_scope_name;
}

export function getWebhookScopeName(): string {
  return _webhook_scope_name;
}

export function isQueuedSubscriptionOidForThisService(oid: Oid): boolean {
  // the service this library is used by will
  return isOidForThisService(oid, getQueuedSubscriptionRequestScopeName());
}

export function isWebhookOidForThisService(oid: Oid): boolean {
  // the service this library is used by will
  return isOidForThisService(oid, getWebhookScopeName());
}

export function isOidForThisService(oid: Oid, scopeName: string): boolean {
  const { scope } = oid.unwrap();
  // the service this library is used by will
  if (scope !== scopeName) {
    return false;
  }
  const oid_string = oid.toString();
  // Find everything until the first '.' and return it:-
  // eslint-disable-next-line no-useless-escape
  const regExp = /^([^\.]*)\./;
  const result = oid_string.match(regExp);
  if (result?.length) {
    const found_short_code = result[1];
    if (found_short_code === getServiceShortCode()) {
      return true;
    }
  }
  return false;
}

function setServiceName(name: string, service_short_code: string) {
  _the_service_name = name;
  _the_service_short_code = service_short_code;
}
function setQueuedSubscriptionRequestScopeName(name: string) {
  _queued_subscription_request_scope_name = name;
}
function setWebhookScopeName(name: string) {
  _webhook_scope_name = name;
}
