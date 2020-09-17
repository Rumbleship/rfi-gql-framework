import { Oid } from '@rumbleship/oid';

export interface IWebhookSubscription {
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  client_request_uuid?: string;
  active?: boolean;
  id?: string | Oid;
}
