import { Model } from 'sequelize-typescript';
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
    version: string;
    get _cache(): IQueuedSubscriptionRequest[];
    set _cache(requestArray: IQueuedSubscriptionRequest[]);
    _cache_map: Map<string, IQueuedSubscriptionRequest>;
    get cache(): Map<string, IQueuedSubscriptionRequest>;
    set cache(cache: Map<string, IQueuedSubscriptionRequest>);
    constructor(version?: string);
    clear(): void;
    add(qsrs: IQueuedSubscriptionRequest[]): void;
}
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 *
 *
 */
export declare class QsrLocalCacheModel extends Model<QsrLocalCacheModel> {
    id: number;
    get cache(): QueuedSubscriptionCache;
    set cache(active_subscriptions: QueuedSubscriptionCache);
    created_at?: Date;
    updated_at?: Date;
}
export declare function loadCache(version: string, opts?: {
    transaction?: Transaction;
}): Promise<QueuedSubscriptionCache>;
export declare function saveCache(cache: QueuedSubscriptionCache, opts?: {
    transaction: Transaction;
}): Promise<void>;
export declare const QsrCacheOidScope = "QsrCache";
export declare const QueuedCacheScopeAndDb: {
    scope: string;
    dbModel: typeof QsrLocalCacheModel;
};
