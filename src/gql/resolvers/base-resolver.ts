import { Scopes } from '@rumbleship/acl';
import { AddToTrace } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';
import { Resolver, Query, Arg, Args, Mutation, ID, Authorized } from 'type-graphql';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ClassType } from '../../helpers';
import { Node, Connection, RelayService, NodeNotification } from '../relay';
import { BaseResolverInterface, BaseReadableResolverInterface } from './base-resolver.interface';
import { SubscriptionWatchFilter } from '../relay/mixins/with-subscription-filter.mixin';
import { withSubscriptionResolver } from './base-subscription-resolver.mixin';

export class GQLBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> implements BaseResolverInterface<TApi, TConnection, TFilter, TInput, TUpdate> {
  public ctx: RumbleshipContext;
  constructor(public service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {
    this.ctx = service.getContext();
    service.nodeType();
  }
  async getAll(filterBy: TFilter) {
    return this.service.getAll(filterBy);
  }
  async getOne(id: string): Promise<TApi> {
    return this.service.getOne(new Oid(id));
  }
  async create(input: TInput): Promise<TApi> {
    return this.service.create(input);
  }
  async update(input: TUpdate): Promise<TApi> {
    return this.service.update(input);
  }
}

export function createBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate,
  TNotification extends NodeNotification<TApi>,
  TSubscriptionFilter extends SubscriptionWatchFilter
>(
  baseName: string,
  objectTypeCls: ClassType<TApi>,
  connectionTypeCls: ClassType<TConnection>,
  filterClsType: ClassType<TFilter>,
  inputClsType: ClassType<TInput>,
  updateClsType: ClassType<TUpdate>,
  notificationClsType: ClassType<TNotification>,
  subscriptionFilterClsType: ClassType<TSubscriptionFilter>,
  defaultScope: Scopes | Scopes[]
): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>> {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  class BaseResolver
    extends GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>
    implements BaseResolverInterface<TApi, TConnection, TFilter, TInput, TUpdate> {
    constructor(service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {
      super(service);
    }

    @AddToTrace()
    @Authorized(defaultScope)
    @Query(type => connectionTypeCls, { name: `${baseName}s` })
    async getAll(@Args(type => filterClsType) filterBy: TFilter): Promise<TConnection> {
      return super.getAll(filterBy);
    }
    @AddToTrace()
    @Authorized(defaultScope)
    @Query(type => objectTypeCls, { name: `${baseName}` })
    async getOne(@Arg('id', type => ID) id: string): Promise<TApi> {
      return super.getOne(id);
    }
    @AddToTrace()
    @Authorized(defaultScope)
    @Mutation(type => objectTypeCls, { name: `add${capitalizedName}` })
    async create(@Arg('input', type => inputClsType) input: TInput): Promise<TApi> {
      return super.create(input);
    }
    @AddToTrace()
    @Authorized(defaultScope)
    @Mutation(type => objectTypeCls, { name: `update${capitalizedName}` })
    async update(@Arg('input', type => updateClsType) input: TUpdate): Promise<TApi> {
      return super.update(input);
    }
  }
  return withSubscriptionResolver(
    capitalizedName,
    BaseResolver,
    notificationClsType,
    subscriptionFilterClsType,
    defaultScope
  );
}

export function createReadOnlyBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TNotification extends NodeNotification<TApi>,
  TSubscriptionFilter extends SubscriptionWatchFilter
>(
  baseName: string,
  objectTypeCls: ClassType<TApi>,
  connectionTypeCls: ClassType<TConnection>,
  filterClsType: ClassType<TFilter>,
  notificationClsType: ClassType<TNotification>,
  subscriptionFilterClsType: ClassType<TSubscriptionFilter>,
  defaultScope: Scopes | Scopes[]
): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, any, any>> {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  class BaseResolver
    extends GQLBaseResolver<TApi, TConnection, TFilter, any, any>
    implements BaseReadableResolverInterface<TApi, TConnection, TFilter> {
    constructor(service: RelayService<TApi, TConnection, TFilter, any, any>) {
      super(service);
    }
    @AddToTrace()
    @Authorized(defaultScope)
    @Query(type => connectionTypeCls, { name: `${baseName}s` })
    async getAll(@Args(type => filterClsType) filterBy: TFilter): Promise<TConnection> {
      return super.getAll(filterBy);
    }
    @AddToTrace()
    @Authorized(defaultScope)
    @Query(type => objectTypeCls, { name: `${baseName}` })
    async getOne(@Arg('id', type => ID) id: string): Promise<TApi> {
      return super.getOne(id);
    }
  }
  return withSubscriptionResolver(
    capitalizedName,
    BaseResolver,
    notificationClsType,
    subscriptionFilterClsType,
    defaultScope
  );
}
