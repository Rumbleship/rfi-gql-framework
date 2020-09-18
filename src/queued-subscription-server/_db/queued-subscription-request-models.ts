import { QueuedSubscriptionRequestModel } from '../queued_subscription_request/db/queued-subscription-request.model';
import {
  getQueuedSubscriptionRequestScopeName,
  getWebhookScopeName
} from '../inititialize-queued-subscription-relay';
import { DbModelAndOidScope } from '../../app/server/init-sequelize';
import { WebhookModel } from '../webhook/db/webhook.model';

export function getQueuedSubscriptionRequestDbModelAndOidScope(): DbModelAndOidScope[] {
  return [
    {
      scope: getQueuedSubscriptionRequestScopeName(),
      dbModel: QueuedSubscriptionRequestModel
    },
    {
      scope: getWebhookScopeName(),
      dbModel: WebhookModel
    }
  ];
}
