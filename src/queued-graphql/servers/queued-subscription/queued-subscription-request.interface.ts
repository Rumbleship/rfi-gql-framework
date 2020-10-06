import { Oid } from '@rumbleship/oid';
import { ExecutionResult } from 'graphql';

import { IWebhookSubscription } from './webhook_subscription.interface';
export type SubscriptionResponse = ExecutionResult;

// tslint:disable-next-line: interface-name
export interface IQueuedSubscriptionRequest extends IWebhookSubscription {
  owner_id?: string;
  marshalled_acl: string;
  publish_to_topic_name: string;
  id?: string | Oid;
  onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
  create_unique_subscription?: boolean; // this allows for each instance to receive a message and is probably only useful when not publishing to anotehr topic
}
