import { Model } from 'sequelize-typescript';
import { QueuedSubscriptionRequestModel } from '../../queued_subscription_request/db/queued-subscription-request.model';
export declare class WebhookModel extends Model<WebhookModel> {
    id: number;
    system_id: string;
    subscription_url: string;
    subscription_name: string;
    topic_name: string;
    active: string;
    webhookSubscriptions?: [QueuedSubscriptionRequestModel];
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
    static afterValidateHook(instance: WebhookModel, options: unknown): void;
}
