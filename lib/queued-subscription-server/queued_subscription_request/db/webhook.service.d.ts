import { SequelizeBaseService } from '../../../db/service/sequelize-base.service';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { NodeServiceOptions } from '../../../gql/relay/relay.interface';
import { ISharedSchema } from '@rumbleship/config';
import { Webhook, WebhookEdge, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate, WebhookService } from '../gql/webhook.relay';
import { WebhookModel } from './webhook.model';
import { QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput } from '../gql';
export declare class WebhookServiceSequelize extends SequelizeBaseService<Webhook, WebhookModel, WebhookEdge, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate, any> implements WebhookService {
    constructor(context: RumbleshipContext);
    addWebhook(config: ISharedSchema, input: WebhookInput, opts: NodeServiceOptions): Promise<Webhook>;
    removeWebhook(webhookId: string, opts: NodeServiceOptions): Promise<void>;
    addSubscription(webhookId: string, input: QueuedSubscriptionRequestInput, opts: NodeServiceOptions): Promise<QueuedSubscriptionRequest>;
    removeSubscription(webhookId: string, subscriptionId: string, opts: NodeServiceOptions): Promise<Webhook>;
    getWebhookSubscriptionsFor(aWebhook: Webhook, filter: Partial<QueuedSubscriptionRequestFilter>, opts: NodeServiceOptions): Promise<QueuedSubscriptionRequestConnection>;
    private createTopicAndSubscriptionForGooglePubSub;
}
