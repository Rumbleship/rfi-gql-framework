export declare const syncQsrGql: import("graphql").DocumentNode;
export interface syncQsr_createOrUpdateQueuedSubscriptionRequest {
    __typename: 'QueuedSubscriptionRequest';
    id: string;
    /**
     * List of services that participate in Queued Subscriptions that can validate and probably execute this query. Automatically discovered and set by system
     */
    serviced_by: string[] | null;
}
export interface syncQsr {
    createOrUpdateQueuedSubscriptionRequest: syncQsr_createOrUpdateQueuedSubscriptionRequest;
}
export interface syncQsrVariables {
    owner_id?: string | null;
    subscription_name: string;
    active: boolean;
    marshalled_acl?: string | null;
    gql_query_string: string;
    query_attributes?: string | null;
    operation_name?: string | null;
    publish_to_topic_name: string;
}
