import { GQLBaseResolver } from '../../../gql/resolvers/base-resolver';
import { BaseResolverInterface } from '../../../gql/resolvers/base-resolver.interface';
import { RelayService } from '../../../gql/relay/relay.interface';
import { RawPayload } from '../../../gql/resolvers/create-node-notification';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestNotification, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate, QueuedSubscriptionRequestFilterForSubscriptions } from './queued_subscription_request.relay';
export declare class QueuedSubscriptionRequestResolver extends GQLBaseResolver<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate> implements BaseResolverInterface<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate> {
    readonly service: RelayService<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate>;
    constructor(service: RelayService<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate>);
    getAll(filterBy: QueuedSubscriptionRequestFilter): Promise<QueuedSubscriptionRequestConnection>;
    getOne(id: string): Promise<QueuedSubscriptionRequest>;
    create(input: QueuedSubscriptionRequestInput): Promise<QueuedSubscriptionRequest>;
    update(input: QueuedSubscriptionRequestUpdate): Promise<QueuedSubscriptionRequest>;
    /**
     * A more complex subscription than normal, as we are subscribing to a topic that receives all of the
     * changes to QueuedSubscriptionRequest models across all the the instances of microservices that use
     * this library.
     *
     * @param rawPayload
     *
     * @param args
     */
    onChange(rawPayload: RawPayload, args: QueuedSubscriptionRequestFilterForSubscriptions): Promise<QueuedSubscriptionRequestNotification>;
}
