import { SequelizeBaseService } from '../../../db/service/sequelize-base.service';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, QueuedSubscriptionRequestService } from '../gql/queued_subscription_request.relay';
import { QueuedSubscriptionRequestModel } from './queued_subscription_request.model';
export declare class QueuedSubscriptionRequestServiceSequelize extends SequelizeBaseService<QueuedSubscriptionRequest, QueuedSubscriptionRequestModel, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, any> implements QueuedSubscriptionRequestService {
    constructor(context: RumbleshipContext);
    createAndCommit(queuedSubscriptionRequestInput: QueuedSubscriptionRequestInput): Promise<void>;
}
