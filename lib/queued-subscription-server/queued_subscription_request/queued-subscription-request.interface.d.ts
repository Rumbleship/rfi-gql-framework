import { ExecutionResult } from 'graphql';
import { Oid } from '@rumbleship/oid';
import { IWebhookSubscription } from './webhook_subscription.interface';
export declare type SubscriptionResponse = ExecutionResult;
export interface IQueuedSubscriptionRequest extends IWebhookSubscription {
    authorized_requestor_id: string;
    marshalled_acl: string;
    publish_to_topic_name: string;
    id?: string | Oid;
    onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
    create_unique_subscription?: boolean;
}