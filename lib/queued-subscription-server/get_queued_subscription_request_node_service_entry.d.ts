import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { QueuedSubscriptionRequestServiceSequelize } from './queued_subscription_request/db/queued_subscription_request.service';
export declare function getQueuedSubscriptionRequestNodeServiceEntry(context: RumbleshipContext): {
    [x: string]: QueuedSubscriptionRequestServiceSequelize;
};
