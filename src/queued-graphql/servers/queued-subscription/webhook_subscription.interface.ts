import { Oid } from '@rumbleship/oid';

export interface IWebhookSubscription {
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  subscription_name?: string;
  active?: boolean;
  id?: string | Oid;
}
