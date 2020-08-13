import { Scopes } from '@rumbleship/acl';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ClassType } from '../../helpers';
import { Node, Connection, RelayService, NodeNotification } from '../relay';
import { BaseResolverInterface } from './base-resolver.interface';
import { SubscriptionWatchFilter } from '../relay/mixins/with-subscription-filter.mixin';
export declare class GQLBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> implements BaseResolverInterface<TApi, TConnection, TFilter, TInput, TUpdate> {
    service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>;
    ctx: RumbleshipContext;
    constructor(service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>);
    getAll(filterBy: TFilter): Promise<TConnection>;
    getOne(id: string): Promise<TApi>;
    create(input: TInput): Promise<TApi>;
    update(input: TUpdate): Promise<TApi>;
}
export declare function createBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, TNotification extends NodeNotification<TApi>, TSubscriptionFilter extends SubscriptionWatchFilter>(baseName: string, objectTypeCls: ClassType<TApi>, connectionTypeCls: ClassType<TConnection>, filterClsType: ClassType<TFilter>, inputClsType: ClassType<TInput>, updateClsType: ClassType<TUpdate>, notificationClsType: ClassType<TNotification>, subscriptionFilterClsType: ClassType<TSubscriptionFilter>, defaultScope: Scopes | Scopes[]): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>>;
export declare function createReadOnlyBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TNotification extends NodeNotification<TApi>, TSubscriptionFilter extends SubscriptionWatchFilter>(baseName: string, objectTypeCls: ClassType<TApi>, connectionTypeCls: ClassType<TConnection>, filterClsType: ClassType<TFilter>, notificationClsType: ClassType<TNotification>, subscriptionFilterClsType: ClassType<TSubscriptionFilter>, defaultScope: Scopes | Scopes[]): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, any, any>>;
