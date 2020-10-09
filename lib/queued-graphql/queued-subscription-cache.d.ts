import { Transaction } from 'sequelize/types';
import { IQueuedSubscriptionRequest } from './servers/queued-subscription/queued-subscription-request.interface';
export declare class PersistableQueuedSubscription implements IQueuedSubscriptionRequest {
    cache_consistency_id: number;
    owner_id: string;
    gql_query_string?: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    subscription_name?: string;
    marshalled_acl: string;
    active?: boolean;
    id: string;
    serviced_by: string[];
}
export declare class QueuedSubscriptionCache {
    highest_cache_consistency_id: number;
    cache: Map<string, IQueuedSubscriptionRequest>;
    clear(): void;
    add(qsrs: IQueuedSubscriptionRequest[]): void;
}
export declare function loadCache(opts?: {
    transaction?: Transaction;
}): Promise<QueuedSubscriptionCache>;
export declare function saveCache(cache: QueuedSubscriptionCache, opts: {
    transaction: Transaction;
}): Promise<void>;
