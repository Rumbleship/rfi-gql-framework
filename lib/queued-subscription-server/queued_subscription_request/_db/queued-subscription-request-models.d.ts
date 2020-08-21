import { QueuedSubscriptionRequestModel } from '../db/queued-subscription-request.model';
export declare function getQueuedSubscriptionRequestDbModelAndOidScope(): {
    scope: string;
    dbModel: typeof QueuedSubscriptionRequestModel;
}[];
