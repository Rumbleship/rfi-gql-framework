import { DbModelAndOidScope } from '../../../app/server/init-sequelize';
import { QueuedSubscriptionRequestModel } from '../db/queued-subscription-request.model';
import { getQueuedSubscriptionRequestScopeName } from '../../inititialize-queued-subscription-relay';
const queuedSubscriptionRequestModels: DbModelAndOidScope[] = [
  {
    scope: getQueuedSubscriptionRequestScopeName(),
    dbModel: QueuedSubscriptionRequestModel
  }
];

export function getQueuedSubscriptionRequestDbModelAndOidScope() {
  return queuedSubscriptionRequestModels;
}
