import { QueuedSubscriptionRequestServiceSequelize } from './queued_subscription_request/db/queued_subscription_request.service';
import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { getQueuedSubscriptionRequestScopeName } from './inititialize_queued_subscription_relay';

export function getQueuedSubscriptionRequestNodeServiceEntry(context: RumbleshipContext) {
  return {
    [getQueuedSubscriptionRequestScopeName()]: new QueuedSubscriptionRequestServiceSequelize(
      context
    )
  };
}
