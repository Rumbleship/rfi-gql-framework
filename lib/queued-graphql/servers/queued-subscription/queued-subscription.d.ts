import { GraphQLSchema, ExecutionResult } from 'graphql';
import { GqlExecutionParams } from '../../helpers/gql-execution-params';
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest, SubscriptionResponse } from './queued-subscription-request.interface';
import { RumbleshipContext } from '../../../app/rumbleship-context';
export declare class QueuedSubscription implements IQueuedSubscriptionRequest {
    private schema;
    private config;
    private googlePublisher;
    activeSubscription?: AsyncIterableIterator<ExecutionResult<{
        [key: string]: any;
    }>>;
    executionContext: GqlExecutionParams;
    owner_id?: string;
    gql_query_string?: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    subscription_name?: string;
    marshalled_acl: string;
    active?: boolean;
    onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
    create_unique_subscription?: boolean;
    cache_consistency_id?: number;
    serviced_by: string[];
    id: string;
    private _topic?;
    /**
     * Throws errors if the subscriptionRequest is not valid
     * @param schema
     * @param subscriptionRequest
     * @param publishToTopicName
     * @param pesistent_id
     */
    constructor(schema: GraphQLSchema, subscriptionRequest: IQueuedSubscriptionRequest, config: ISharedSchema, googlePublisher?: GooglePubSub);
    /**
     * static so it can be used to validate subscriptions at the point of API
     * Note: Does not validate that the queryAttibutes are valid.
     *
     * @param schema
     * @param subscriptionRequest
     */
    static validateSubscriptionRequest(schema: GraphQLSchema, subscriptionRequest: IQueuedSubscriptionRequest): GqlExecutionParams;
    /**
     * @usage publishes responses to the QueuedSubscriptionRequest
     *
     * @note One of the structural goals of the Queued Subscription Infrastructure is to be able to react
     * to changes to a _single_ record anywhere in the distributed object model in an ordered way
     * from anywhere else in the distributed object model.
     *
     * Goal with generating the orderingKey from the response is to force ordered consumption of
     * messages that arise from changes to a _single record_ -- without blocking consumption of
     * other messages flowing through the bus.
     *
     * If the `execution_result` doesn't have a node to order on id for, then we go to the
     * `subscription_id` so failure to process messages for any given subscriptoin does not block
     * message processing for other subscriptions.
     *
     * Failing that, we use the default key (this should never be reached)
     */
    publishResponse(ctx: RumbleshipContext, response: SubscriptionResponse): Promise<string>;
    protected getTopic(ctx: RumbleshipContext): Promise<Topic>;
    start(): Promise<void>;
    onGqlSubscribeResponse(ctx: RumbleshipContext, executionResult: ExecutionResult): Promise<void>;
    stop(): Promise<void>;
}
/**
 *
 * @param executionResult
 * @returns a cloned copy of {executionResult} with the marshalledTrace removed.
 * @note the cloned copy of executionResult **cannot** be used throughout the graphql/type-graphql stack
 * it should (primarily) be used to propagate results to the trace.
 */
export declare function traceSafeExecutionResult(executionResult: ExecutionResult): ExecutionResult;
