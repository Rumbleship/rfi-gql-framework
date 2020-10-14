import { Oid } from '@rumbleship/oid';
import { RfiPubSubMessageBase } from '../../interfaces';

export interface IWebhookSubscription extends RfiPubSubMessageBase {
  cache_consistency_id?: number;
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  subscription_name?: string;
  active?: boolean;
  id?: string | Oid;
}
