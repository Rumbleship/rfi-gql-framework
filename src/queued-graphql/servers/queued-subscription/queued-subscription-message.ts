import { SubscriptionResponse } from './queued-subscription-request.interface';

export interface QueuedSubscriptionMessage {
  owner_id: string;
  subscription_name: string;
  subscription_id: string;
  subscription_response: SubscriptionResponse;
  marshalled_trace?: string;
}
