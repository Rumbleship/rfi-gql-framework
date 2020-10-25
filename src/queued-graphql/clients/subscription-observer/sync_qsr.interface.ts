import { gql } from '@rumbleship/apollo-server-hapi';

export const syncQsrGql = gql`
  mutation syncQsr(
    $owner_id: ID
    $subscription_name: String!
    $active: Boolean!
    $marshalled_acl: String
    $gql_query_string: String!
    $query_attributes: String
    $operation_name: String
    $publish_to_topic_name: String!
  ) {
    createOrUpdateQueuedSubscriptionRequest(
      input: {
        owner_id: $owner_id
        subscription_name: $subscription_name
        active: $active
        marshalled_acl: $marshalled_acl
        gql_query_string: $gql_query_string
        query_attributes: $query_attributes
        operation_name: $operation_name
        publish_to_topic_name: $publish_to_topic_name
      }
    ) {
      id
      serviced_by
    }
  }
`;
// ====================================================
// GraphQL mutation operation: syncQsr
// ====================================================

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
