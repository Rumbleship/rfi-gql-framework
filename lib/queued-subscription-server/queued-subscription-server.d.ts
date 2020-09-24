import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { IGcpConfig } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
export declare class QueuedSubscriptionServer {
    schema: GraphQLSchema;
    protected config: IGcpConfig;
    queuedSubscriptions: Map<string, QueuedSubscription>;
    queuedSubscriptionRequestObserver: QueuedSubscription;
    constructor(schema: GraphQLSchema, config: IGcpConfig);
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
