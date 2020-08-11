import { Node, RelayService, RelayInputTypeBase, RelayFilterBase } from '../../../gql/relay/relay.interface';
import { AttribType } from '../../../gql/relay/attrib.enum';
import { Oid } from '@rumbleship/oid';
import { IQueuedSubscriptionRequest } from '../queued_subscription_request';
import { ClassType } from '../../../helpers';
export declare function buildQueuedSubscriptionRequestBaseAttribs(attribType: AttribType): ClassType<IQueuedSubscriptionRequest>;
export interface QueuedSubscriptionRequestService extends RelayService<QueuedSubscriptionRequest, QueuedSubscriptionRequestConnection, QueuedSubscriptionRequestFilter, QueuedSubscriptionRequestInput, QueuedSubscriptionRequestUpdate> {
    createAndCommit(subscriptionControlInput: QueuedSubscriptionRequestInput): Promise<void>;
}
declare const QueuedSubscriptionRequestConcrete_base: ClassType<IQueuedSubscriptionRequest>;
declare class QueuedSubscriptionRequestConcrete extends QueuedSubscriptionRequestConcrete_base {
}
declare const QueuedSubscriptionRequest_base: {
    new (...args: any[]): {
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | undefined;
    };
} & typeof QueuedSubscriptionRequestConcrete;
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
declare const QueuedSubscriptionRequestInput_base: ClassType<IQueuedSubscriptionRequest>;
export declare class QueuedSubscriptionRequestInput extends QueuedSubscriptionRequestInput_base implements RelayInputTypeBase<unknown> {
}
declare const QueuedSubscriptionRequestUpdate_base: ClassType<IQueuedSubscriptionRequest>;
export declare class QueuedSubscriptionRequestUpdate extends QueuedSubscriptionRequestUpdate_base implements RelayInputTypeBase<unknown> {
    id: string;
}
declare const ConcreteQueuedSubscriptionRequestFilter_base: ClassType<IQueuedSubscriptionRequest>;
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
/***
 * We could create this list off the actual Relay object, but that would project into the schema
 * internal properties suvh as _service. So although it is labourious, we explicitly create the
 * property watch list we want to watch.
 * TODO
 * There is probably some fabulous way of making this all a lot more typesafe,
 * but I really dont have time right now to work that out
 * hints may be here: https://stackoverflow.com/questions/54058699/is-there-a-way-to-dynamically-generate-enums-on-typescript-based-on-object-keys
 * I kind of think we are getting to the point where we may want to make some 'super decorators' that, similar to the buildAttributes builders
 * wrap both the Gql decorators and also the TypescriptSequelize so we can trully have a singular definition of the attributes,
 * with parameters in the super decorator that slects them in and out of the different types...
 * Bit late now.
 */
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
export declare class QueuedSubscriptionRequestFilterForSubscriptions extends QueuedSubscriptionRequestFilterForSubscriptions_base implements RelayFilterBase<QueuedSubscriptionRequest> {
}
export {};
