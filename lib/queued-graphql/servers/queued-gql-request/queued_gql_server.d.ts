import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { ISharedSchema } from '@rumbleship/config';
import { ExecutionResult, GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { GqlExecutionParams } from '../../helpers';
import { IQueuedGqlRequest } from '../../interfaces/queued-gql-request.interface';
import { RfiPubSubSubscription } from '../../shared/rfi-pubsub-subscription';
/**
 * Complement to the queuedeSubscription service that listens for straight graphql queries and mutations
 * on a GRAPHQL_REQUEST channel and responds to the request over the topic passed in to the request.
 *
 * Note multiple services can respond the the same request. If the request is for an operation that is not supported it is acked to the pubsub engine,
 * but no response is given. If how ever the graphql is malformed, all services may respond.
 *
 * If the response is understood by one or more services, but has some othewr error, then a response will be given.
 *
 *
 * This is an 'inner ring' service that only runs internally to the
 *
 */
export declare class QueuedGqlRequestServer {
    config: ISharedSchema;
    private schema;
    request_topic_name: string;
    request_subscription_name: string;
    service_name: string;
    protected _request_subscription: RfiPubSubSubscription<IQueuedGqlRequest>;
    protected _pubsub: GooglePubSub;
    constructor(config: ISharedSchema, schema: GraphQLSchema);
    start(ctx: RumbleshipContext): Promise<void>;
    publishResponse(ctx: RumbleshipContext, request: IQueuedGqlRequest, executionResponse: ExecutionResult): Promise<string>;
    stop(ctx: RumbleshipContext): Promise<void>;
    static validateGqlRequest(schema: GraphQLSchema, subscriptionRequest: IQueuedGqlRequest): GqlExecutionParams;
}
export declare class QueuedRequestClient {
}
