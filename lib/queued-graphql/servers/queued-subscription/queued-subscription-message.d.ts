import { SubscriptionResponse } from './queued-subscription-request.interface';
export interface QueuedSubscriptionMessage {
    owner_id: string;
    subscription_name: string;
    subscription_id: string;
    subscription_response: SubscriptionResponse;
    marshalled_trace?: string;
    publisher_version: string;
    publisher_service_name: string;
}
