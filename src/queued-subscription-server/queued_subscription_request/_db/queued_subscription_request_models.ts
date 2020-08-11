import { DbModelAndOidScope } from '../../../app/server/init-sequelize';
import { QueuedSubscriptionRequestModel } from '../db/queued_subscription_request.model';
import { getQueuedSubscriptionRequestScopeName } from '../../inititialize_queued_subscription_relay';
const queuedSubscriptionRequestModels: DbModelAndOidScope[] = [
  {
    scope: getQueuedSubscriptionRequestScopeName(),
    dbModel: QueuedSubscriptionRequestModel
  }
];

export function getQueuedSubscriptionRequestDbModelAndOidScope() {
  return queuedSubscriptionRequestModels;
}
