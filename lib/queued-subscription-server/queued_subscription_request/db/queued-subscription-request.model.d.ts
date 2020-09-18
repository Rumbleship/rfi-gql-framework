import { Model } from 'sequelize-typescript';
import { WebhookModel } from '../../webhook/db/webhook.model';
export declare class QueuedSubscriptionRequestModel extends Model<QueuedSubscriptionRequestModel> {
    id: number;
    owner_id: string;
    marshalled_acl: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
    publish_to_topic_name: string;
    subscription_name: string;
    active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
    webhook_id: number;
    webhook?: WebhookModel;
    static afterValidateHook(instance: QueuedSubscriptionRequestModel, options: unknown): void;
}
