import { Model } from 'sequelize-typescript';
export declare class QueuedSubscriptionRequestModel extends Model<QueuedSubscriptionRequestModel> {
    id: number;
    authorized_requestor_id: string;
    marshalled_acl: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    client_request_uuid: string;
    active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
    static afterValidateHook(instance: QueuedSubscriptionRequestModel, options: unknown): void;
}
