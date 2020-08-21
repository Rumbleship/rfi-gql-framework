import { ExecutionResult } from 'graphql';
import { Oid } from '@rumbleship/oid';
export declare type SubscriptionResponse = ExecutionResult;
export interface IQueuedSubscriptionRequest {
    authorized_requestor_id: string;
    marshalled_acl: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    client_request_uuid: string;
    active: boolean;
    id?: string | Oid;
    onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
    create_unique_subscription?: boolean;
}
