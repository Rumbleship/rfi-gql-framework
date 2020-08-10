import { SequelizeBaseService, RumbleshipContext } from '../../../';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, QueuedSubscriptionRequestService } from '../gql/queued_subscription_request.relay';
import { QueuedSubscriptionRequestModel } from './queued_subscription_request.model';
export declare class QueuedSubscriptionRequestServiceSequelize extends SequelizeBaseService<QueuedSubscriptionRequest, QueuedSubscriptionRequestModel, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, any> implements QueuedSubscriptionRequestService {
    constructor(context: RumbleshipContext);
    createAndCommit(queuedSubscriptionRequestInput: QueuedSubscriptionRequestInput): Promise<void>;
}
