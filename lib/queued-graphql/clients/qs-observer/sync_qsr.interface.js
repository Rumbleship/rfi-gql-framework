"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncQsrGql = void 0;
const apollo_server_hapi_1 = require("@rumbleship/apollo-server-hapi");
exports.syncQsrGql = apollo_server_hapi_1.gql `
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
//# sourceMappingURL=sync_qsr.interface.js.map