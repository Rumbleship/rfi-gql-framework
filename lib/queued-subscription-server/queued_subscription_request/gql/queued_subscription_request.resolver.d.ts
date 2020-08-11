import { BaseResolverInterface } from '../../../gql/resolvers/base-resolver.interface';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate } from './queued_subscription_request.relay';
import { ClassType } from '../../../helpers';
export declare function buildQueuedSubscriptionRequestResolver(): ClassType<BaseResolverInterface<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate>>;
