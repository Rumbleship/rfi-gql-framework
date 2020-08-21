import { QueuedSubscriptionRequestModel } from '../db/queued-subscription-request.model';
import { getQueuedSubscriptionRequestScopeName } from '../../inititialize-queued-subscription-relay';

export function getQueuedSubscriptionRequestDbModelAndOidScope() {
  return [
    {
      scope: getQueuedSubscriptionRequestScopeName(),
      dbModel: QueuedSubscriptionRequestModel
    }
  ];
}
