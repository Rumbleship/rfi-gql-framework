import { QueuedSubscriptionRequestServiceSequelize } from './queued_subscription_request/db/queued_subscription_request.service';
import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
export declare function getQueuedSubscriptionRequestNodeServiceEntry(context: RumbleshipContext): {
    [x: string]: QueuedSubscriptionRequestServiceSequelize;
};
