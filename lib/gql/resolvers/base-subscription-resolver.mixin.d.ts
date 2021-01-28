import { NodeNotification, SubscriptionWatchFilter, Node } from '../relay';
import { ClassType } from '../../helpers/classtype';
import { Scopes } from '@rumbleship/acl';
import { RawPayload } from './create-node-notification';
import { BaseReadableResolverInterface } from './base-resolver.interface';
export declare function withSubscriptionResolver<TBase extends ClassType<BaseReadableResolverInterface<TApi, any, any>>, TApi extends Node<TApi>, TNotification extends NodeNotification<TApi>, TSubscriptionFilter extends SubscriptionWatchFilter>(capitalizedName: string, Base: TBase, notificationClsType: ClassType<TNotification>, subscriptionFilterClsType: ClassType<TSubscriptionFilter>, defaultScope: Scopes | Scopes[]): {
    new (...args: any[]): {
        onChange(rawPayload: RawPayload | undefined, args: SubscriptionWatchFilter): Promise<NodeNotification<TApi> | null>;
        ctx: import("../..").RumbleshipContext;
        getAll(filterBy: any): Promise<any>;
        getOne(id: string): Promise<TApi>;
    };
} & TBase;
