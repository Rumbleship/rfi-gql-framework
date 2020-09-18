import { Node, RelayService, RelayInputTypeBase, RelayFilterBase, NodeServiceOptions } from '../../../gql/relay/relay.interface';
import { Oid } from '@rumbleship/oid';
import { QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequest } from '../../queued_subscription_request';
import { ISharedSchema } from '@rumbleship/config';
export interface WebhookService extends RelayService<Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate> {
    addWebhook(config: ISharedSchema, input: WebhookInput, opts: NodeServiceOptions): Promise<Webhook>;
    removeWebhook(webhookId: string, opts: NodeServiceOptions): Promise<void>;
    addSubscription(webhookId: string, input: Partial<QueuedSubscriptionRequestInput>, opts: NodeServiceOptions): Promise<QueuedSubscriptionRequest>;
    removeSubscription(webhookId: string, subscriptionId: string, opts: NodeServiceOptions): Promise<Webhook>;
    getWebhookSubscriptionsFor(aWebhook: Webhook, filter: QueuedSubscriptionRequestFilter, opts: NodeServiceOptions): Promise<QueuedSubscriptionRequestConnection>;
}
declare const WebhookConcrete_base: import("../../..").ClassType<import("./webhook.attribs").WebhookBase>;
declare class WebhookConcrete extends WebhookConcrete_base {
}
declare const Webhook_base: {
    new (...args: any[]): {
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & typeof WebhookConcrete;
export declare class Webhook extends Webhook_base implements Node<Webhook> {
    _service: WebhookService;
    id: Oid;
}
declare const WebhookNotification_base: import("../../..").ClassType<import("../../..").NodeNotification<Webhook>>;
export declare class WebhookNotification extends WebhookNotification_base {
}
declare const WebhookEdge_base: import("../../..").ClassType<import("../../../gql/relay/relay.interface").Edge<Webhook>>;
export declare class WebhookEdge extends WebhookEdge_base {
}
declare const WebhookConnection_base: import("../../..").ClassType<import("../../../gql/relay/relay.interface").Connection<Webhook>>;
export declare class WebhookConnection extends WebhookConnection_base {
}
declare const WebhookInput_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & import("../../..").ClassType<import("./webhook.attribs").WebhookBase>;
export declare class WebhookInput extends WebhookInput_base implements RelayInputTypeBase<unknown> {
}
declare const WebhookUpdate_base: import("../../..").ClassType<import("./webhook.attribs").WebhookBase>;
export declare class WebhookUpdate extends WebhookUpdate_base implements RelayInputTypeBase<unknown> {
    id: string;
}
declare const ConcreteWebhookFilter_base: import("../../..").ClassType<import("./webhook.attribs").WebhookBase>;
declare class ConcreteWebhookFilter extends ConcreteWebhookFilter_base {
}
declare const WebhookFilter_base: {
    new (...args: any[]): {
        order_by?: import("../../..").RelayOrderBy<any> | undefined;
    };
} & {
    new (...args: any[]): {
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        id?: string | undefined;
    };
} & {
    new (...args: any[]): {
        created_at?: Date | undefined;
        created_between?: import("../../..").DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: import("../../..").DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: import("../../..").DateRange | undefined;
    };
} & typeof ConcreteWebhookFilter;
export declare class WebhookFilter extends WebhookFilter_base implements RelayFilterBase<Webhook> {
}
declare const WebhookFilterForSubscriptions_base: {
    new (...args: any[]): {
        watch_list?: string[] | undefined;
        id?: string | undefined;
    };
} & {
    new (...args: any[]): {
        created_at?: Date | undefined;
        created_between?: import("../../..").DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: import("../../..").DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: import("../../..").DateRange | undefined;
    };
} & typeof ConcreteWebhookFilter;
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
export declare class WebhookFilterForSubscriptions extends WebhookFilterForSubscriptions_base implements RelayFilterBase<Webhook> {
}
export {};
