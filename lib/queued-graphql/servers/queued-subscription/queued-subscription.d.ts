import { GraphQLSchema, ExecutionResult } from 'graphql';
import { GqlExecutionParams } from '../../helpers/gql-execution-params';
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
import { IGcpConfig } from '@rumbleship/config';
import { IQueuedSubscriptionRequest, SubscriptionResponse } from './queued-subscription-request.interface';
import { RumbleshipContext } from '../../../app/rumbleship-context';
export declare class QueuedSubscription implements IQueuedSubscriptionRequest {
    private schema;
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
    constructor(schema: GraphQLSchema, subscriptionRequest: IQueuedSubscriptionRequest, config: IGcpConfig, googlePublisher?: GooglePubSub);
    /**
     * static so it can be used to validate subscriptions at the point of API
     * Note: Does not validate that the queryAttibutes are valid.
     *
     * @param schema
     * @param subscriptionRequest
     */
    static validateSubscriptionRequest(schema: GraphQLSchema, subscriptionRequest: IQueuedSubscriptionRequest): GqlExecutionParams;
    /**
     * publishes repsononses to the QueuedSubscriptionRequest
     */
    publishResponse(ctx: RumbleshipContext, response: SubscriptionResponse): Promise<string>;
    protected getTopic(ctx: RumbleshipContext): Promise<Topic>;
    start(): Promise<void>;
    onGqlSubscribeResponse(ctx: RumbleshipContext, executionResult: ExecutionResult): Promise<void>;
    stop(): Promise<void>;
}
