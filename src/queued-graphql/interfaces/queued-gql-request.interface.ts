import { ExecutionResult } from 'graphql';
import { RfiPubSubMessageBase } from './rfi-pub-sub-message-base.interface';
// TODO: refactor interfaces between Query, Mutation and Subscription

// tslint:disable-next-line: interface-name
export interface IQueuedGqlRequest extends RfiPubSubMessageBase {
  client_request_id: string;
  respond_on_error?: boolean;
  owner_id: string;
  marshalled_acl: string;
  publish_to_topic_name: string;
  gql_query_string: string;
  query_attributes?: string;
  operation_name?: string;
}

// tslint:disable-next-line: interface-name
export interface IQueuedGqlResponse extends RfiPubSubMessageBase {
  client_request_id: string;
  service_name: string;
  response: ExecutionResult;
}
