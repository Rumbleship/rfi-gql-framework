import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
export declare class QueuedSubscriptionServer {
    protected config: ISharedSchema;
    schema: GraphQLSchema;
    queuedSubscriptions: Map<string, QueuedSubscription>;
    queuedSubscriptionRequestObserver: QueuedSubscription;
    queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;
    constructor(config: ISharedSchema, schema: GraphQLSchema);
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    initializeRequestObserver(schema: GraphQLSchema): QueuedSubscription;
    start(ctx: RumbleshipContext): Promise<void>;
    stop(): Promise<void>;
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscription(key: string, request: IQueuedSubscriptionRequest): QueuedSubscription;
    removeSubscription(key: string): Promise<void>;
}
