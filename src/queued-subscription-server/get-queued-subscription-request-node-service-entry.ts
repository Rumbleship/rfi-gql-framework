import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import {
  getQueuedSubscriptionRequestScopeName,
  getWebhookScopeName
} from './inititialize-queued-subscription-relay';
import { QueuedSubscriptionRequestServiceSequelize } from './queued_subscription_request/db/queued-subscription-request.service';
import { NodeService } from '../gql/relay';
import { WebhookServiceSequelize } from './webhook';

/***
 * Helps reduce cyclic dependancies....
 */
export function getQueuedSubscriptionRequestNodeServiceEntry(
  context: RumbleshipContext
): { [index: string]: NodeService<any> } {
  return {
    [getQueuedSubscriptionRequestScopeName()]: new QueuedSubscriptionRequestServiceSequelize(
      context
    )
  };
}
export function getWebhookNodeServiceEntry(
  context: RumbleshipContext
): { [index: string]: NodeService<any> } {
  return {
    [getWebhookScopeName()]: new WebhookServiceSequelize(context)
  };
}
