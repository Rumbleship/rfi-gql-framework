import { ExecutionResult } from 'graphql';
import { RfiPubSubMessageBase } from './rfi-pubsub-subscription';
export interface IQueuedGqlRequest extends RfiPubSubMessageBase {
    client_request_id: string;
    owner_id: string;
    marshalled_acl: string;
    publish_to_topic_name: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
}
export interface IQueuedGqlResponse extends RfiPubSubMessageBase {
    client_request_id: string;
    service_name: string;
    response: ExecutionResult;
}
