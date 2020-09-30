import { Type } from 'class-transformer';
import { IQueuedSubscriptionRequest } from './servers';

export class PersistableQueuedSubscription implements IQueuedSubscriptionRequest {
  owner_id!: string;
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  publish_to_topic_name!: string;
  subscription_name?: string;
  marshalled_acl!: string;
  active?: boolean;
  id!: string;
}
export class QueuedSubscriptionCache {
  @Type(() => PersistableQueuedSubscription)
  cache: Map<string, IQueuedSubscriptionRequest> = new Map();
}
