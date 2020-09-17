import { SequelizeBaseService } from '../../../db/service/sequelize-base.service';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { NodeServiceOptions } from '../../../gql/relay/relay.interface';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, QueuedSubscriptionRequestService } from '../gql/queued-subscription-request.relay';
import { QueuedSubscriptionRequestModel } from './queued-subscription-request.model';
import { Webhook } from '../gql/webhook.relay';
export declare class QueuedSubscriptionRequestServiceSequelize extends SequelizeBaseService<QueuedSubscriptionRequest, QueuedSubscriptionRequestModel, QueuedSubscriptionRequestEdge, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, Partial<QueuedSubscriptionRequestUpdate>, any> implements QueuedSubscriptionRequestService {
    constructor(context: RumbleshipContext);
    createAndCommit(queuedSubscriptionRequestInput: QueuedSubscriptionRequestInput): Promise<void>;
    getWebhookFor(aQsr: QueuedSubscriptionRequest, opts: NodeServiceOptions): Promise<Webhook | undefined>;
}
