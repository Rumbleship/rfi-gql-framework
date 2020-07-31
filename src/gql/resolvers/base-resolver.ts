import { Context } from './../../app/rumbleship-context/rumbleship-context.interface';
import { Scopes } from '@rumbleship/acl';
import { AddToTrace } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';
import {
  Resolver,
  Query,
  Arg,
  Args,
  Mutation,
  ID,
  Subscription,
  Root,
  Authorized
} from 'type-graphql';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ClassType } from '../../helpers';
import {
  Node,
  Connection,
  RelayService,
  NodeNotification,
  NODE_CHANGE_NOTIFICATION,
  NodeService
} from '../relay';
import { BaseResolverInterface, BaseReadableResolverInterface } from './base-resolver.interface';
import { RawPayload, createNodeNotification } from './create-node-notification';
import { NodeChangePayload } from 'src/app';
import { NotFoundError } from 'src/app/errors';

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
  TNotification extends NodeNotification<TApi>
>(
  baseName: string,
  objectTypeCls: ClassType<TApi>,
  connectionTypeCls: ClassType<TConnection>,
  filterClsType: ClassType<TFilter>,
  inputClsType: ClassType<TInput>,
  updateClsType: ClassType<TUpdate>,
  notificationClsType: ClassType<TNotification>,
  defaultScope: Scopes | Scopes[]
): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>> {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  class BaseResolver extends GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>
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

    @AddToTrace()
    @Authorized(defaultScope)
    @Subscription(type => notificationClsType, {
      name: `on${capitalizedName}Change`,
      topics: `${NODE_CHANGE_NOTIFICATION}_${capitalizedName}`,
      nullable: true
    })
    async onChange(@Root() rawPayload: RawPayload): Promise<NodeNotification<TApi>> {
      return createNodeNotification(rawPayload, this, notificationClsType);
    }
  }
  return BaseResolver;
}

export function createReadOnlyBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TNotification extends NodeNotification<TApi>
>(
  baseName: string,
  objectTypeCls: ClassType<TApi>,
  connectionTypeCls: ClassType<TConnection>,
  filterClsType: ClassType<TFilter>,
  notificationClsType: ClassType<TNotification>,
  defaultScope: Scopes | Scopes[]
): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, any, any>> {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  class BaseResolver extends GQLBaseResolver<TApi, TConnection, TFilter, any, any>
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

    @AddToTrace()
    @Authorized(defaultScope)
    @Subscription(type => notificationClsType, {
      name: `on${capitalizedName}Change`,
      topics: `${NODE_CHANGE_NOTIFICATION}_${capitalizedName}`,
      nullable: true,
      filter: BaseResolver.filterById
    })
    async onChange(@Root() rawPayload: RawPayload): Promise<NodeNotification<TApi>> {
      return createNodeNotification(rawPayload, this, notificationClsType);
    }

    static async filterById({
      payload: rawPayload,
      args,
      context
    }: {
      payload: RawPayload;
      args?: { id?: string };
      context: Context;
    }): Promise<boolean> {
      return context.beeline.withAsyncSpan({ name: 'subscription.filter' }, async () => {
        if (!args?.id) {
          return true;
        }
        const payload: NodeChangePayload = JSON.parse(rawPayload.data.toString());
        context.beeline.addTraceContext({ 'subscription.filter.id': args.id });

        const oid = new Oid(payload.oid);
        const { scope } = oid.unwrap();
        let node;
        const nodeServices = context.container.get('nodeServices') as object;
        if (scope in nodeServices) {
          try {
            node = await (Reflect.get(nodeServices, scope) as NodeService<Node<object>>).getOne(
              oid
            );
          } catch (error) {
            if (error instanceof NotFoundError) {
              context.beeline.addTraceContext({ 'subscription.filter.result': false });
              return false;
            }
            throw error;
          }
        }
        const filtered = node ? node.id.toString() === args?.id : false;
        context.beeline.addTraceContext({ 'subscription.filter.result': filtered });
        return filtered;
      });
    }
  }
  return BaseResolver;
}
