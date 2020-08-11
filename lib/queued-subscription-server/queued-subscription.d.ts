import { GraphQLSchema, ExecutionResult } from 'graphql';
import { GqlExecutionParams } from './gql-execution-params';
import { IQueuedSubscriptionRequest, SubscriptionResponse } from './queued_subscription_request/queued_subscription_request';
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
import { IGcpConfig } from '@rumbleship/config';
export declare class QueuedSubscription implements IQueuedSubscriptionRequest {
    private schema;
    private googlePublisher;
    activeSubscription?: AsyncIterableIterator<ExecutionResult<{
        [key: string]: any;
    }>>;
    executionContext: GqlExecutionParams;
    authorized_requestor_id: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    client_request_uuid: string;
    marshalled_acl: string;
    active: boolean;
    onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
    create_unique_subscription?: boolean;
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
    publishResponse(response: SubscriptionResponse): Promise<string>;
    protected getTopic(): Promise<Topic>;
    start(): Promise<void>;
    stop(): Promise<void>;
}