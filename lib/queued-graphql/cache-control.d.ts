import { QueuedSubscriptionCache } from './queued-subscription-cache';
export declare function loadCache(): Promise<QueuedSubscriptionCache>;
export declare function saveCache(cache: QueuedSubscriptionCache): Promise<void>;
