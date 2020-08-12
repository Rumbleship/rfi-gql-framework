import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { getQueuedSubscriptionRequestScopeName } from './inititialize_queued_subscription_relay';
import { QueuedSubscriptionRequestServiceSequelize } from './queued_subscription_request/db/queued_subscription_request.service';
import { NodeService } from '../gql/relay';
/***
 * Helps reduce cyclic dependancies....
 */
export function getQueuedSubscriptionRequestNodeServiceEntry(
  context: RumbleshipContext
): { [x: string]: NodeService<any> } {
  return {
    [getQueuedSubscriptionRequestScopeName()]: new QueuedSubscriptionRequestServiceSequelize(
      context
    )
  };
}
