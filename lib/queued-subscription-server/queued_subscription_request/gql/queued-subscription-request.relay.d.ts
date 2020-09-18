import { Node, RelayService, RelayInputTypeBase, RelayFilterBase, NodeServiceOptions } from '../../../gql/relay/relay.interface';
import { AttribType } from '../../../gql/relay/attrib.enum';
import { Oid } from '@rumbleship/oid';
import { IQueuedSubscriptionRequest } from '../queued-subscription-request.interface';
import { ClassType } from '../../../helpers';
import { IWebhookSubscription } from '../webhook_subscription.interface';
import { Webhook } from '../../webhook/gql/webhook.relay';
export declare function buildQueuedSubscriptionRequestBaseAttribs(attribType: AttribType): ClassType<Partial<IQueuedSubscriptionRequest>>;
export interface QueuedSubscriptionRequestService extends RelayService<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate> {
    createAndCommit(subscriptionControlInput: QueuedSubscriptionRequestInput): Promise<void>;
    getWebhookFor(aQsr: QueuedSubscriptionRequest, opts: NodeServiceOptions): Promise<Webhook | undefined>;
}
export declare class WebhookSubscription implements IWebhookSubscription {
    gql_query_string?: string;
    query_attributes?: string;
    operation_name?: string;
    subscription_name?: string;
    active?: boolean;
}
declare const QueuedSubscriptionRequest_base: {
    new (...args: any[]): {
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & ClassType<Partial<IQueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequest extends QueuedSubscriptionRequest_base implements Node<QueuedSubscriptionRequest> {
    _service: QueuedSubscriptionRequestService;
    id: Oid;
}
declare const QueuedSubscriptionRequestNotification_base: ClassType<import("../../..").NodeNotification<QueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequestNotification extends QueuedSubscriptionRequestNotification_base {
}
declare const QueuedSubscriptionRequestEdge_base: ClassType<import("../../../gql/relay/relay.interface").Edge<QueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequestEdge extends QueuedSubscriptionRequestEdge_base {
}
declare const QueuedSubscriptionRequestConnection_base: ClassType<import("../../../gql/relay/relay.interface").Connection<QueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequestConnection extends QueuedSubscriptionRequestConnection_base {
}
declare const QueuedSubscriptionRequestInput_base: ClassType<Partial<IQueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequestInput extends QueuedSubscriptionRequestInput_base implements RelayInputTypeBase<unknown> {
}
declare const QueuedSubscriptionRequestUpdate_base: ClassType<Partial<IQueuedSubscriptionRequest>>;
export declare class QueuedSubscriptionRequestUpdate extends QueuedSubscriptionRequestUpdate_base implements RelayInputTypeBase<unknown> {
    id: string;
}
declare const ConcreteQueuedSubscriptionRequestFilter_base: ClassType<Partial<IQueuedSubscriptionRequest>>;
declare class ConcreteQueuedSubscriptionRequestFilter extends ConcreteQueuedSubscriptionRequestFilter_base {
}
declare const QueuedSubscriptionRequestFilter_base: {
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
} & typeof ConcreteQueuedSubscriptionRequestFilter;
export declare class QueuedSubscriptionRequestFilter extends QueuedSubscriptionRequestFilter_base implements RelayFilterBase<QueuedSubscriptionRequest> {
}
declare const QueuedSubscriptionRequestFilterForSubscriptions_base: {
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
} & typeof ConcreteQueuedSubscriptionRequestFilter;
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
export declare class QueuedSubscriptionRequestFilterForSubscriptions extends QueuedSubscriptionRequestFilterForSubscriptions_base implements RelayFilterBase<QueuedSubscriptionRequest> {
}
export {};
