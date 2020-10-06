import { Oid } from '@rumbleship/oid';
import { ExecutionResult } from 'graphql';
import { IWebhookSubscription } from './webhook_subscription.interface';
export declare type SubscriptionResponse = ExecutionResult;
export interface IQueuedSubscriptionRequest extends IWebhookSubscription {
    owner_id?: string;
    marshalled_acl: string;
    publish_to_topic_name: string;
    id?: string | Oid;
    onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
    create_unique_subscription?: boolean;
}
