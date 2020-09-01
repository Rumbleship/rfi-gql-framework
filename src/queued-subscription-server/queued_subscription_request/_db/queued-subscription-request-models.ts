import { QueuedSubscriptionRequestModel } from '../db/queued-subscription-request.model';
import { getQueuedSubscriptionRequestScopeName } from '../../inititialize-queued-subscription-relay';
import { DbModelAndOidScope } from '../../../app/server/init-sequelize';

export function getQueuedSubscriptionRequestDbModelAndOidScope(): DbModelAndOidScope[] {
  return [
    {
      scope: getQueuedSubscriptionRequestScopeName(),
      dbModel: QueuedSubscriptionRequestModel
    }
  ];
}
