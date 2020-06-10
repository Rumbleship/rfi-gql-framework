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
import { Oid } from '@rumbleship/oid';
import { Scopes } from '@rumbleship/acl';
// tslint:disable-next-line: no-circular-imports
import { RelayService, Node, Connection } from './index';
import { RumbleshipContext } from './../server/rumbleship-context';
import { ClassType } from './../helpers/classtype';
import { NodeNotification, NODE_CHANGE_NOTIFICATION } from './node-notification';
import { createPayloadUsingStr, RawPayload } from '../pubsub/helper';
import { AddToTrace } from '@rumbleship/o11y';

export class GQLBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> {
  public ctx: RumbleshipContext;
  constructor(protected service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {
    this.ctx = service.getContext();
    service.nodeType();
  }
  async getAll(filterBy: TFilter): Promise<TConnection> {
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
  class BaseResolver extends GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate> {
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
      return this.ctx.beeline.bindFunctionToTrace(() =>
        createPayloadUsingStr(rawPayload, this, notificationClsType)
      )();
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
  class BaseResolver extends GQLBaseResolver<TApi, TConnection, TFilter, any, any> {
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
      nullable: true
    })
    async onChange(@Root() rawPayload: RawPayload): Promise<NodeNotification<TApi>> {
      return this.ctx.beeline.bindFunctionToTrace(() =>
        createPayloadUsingStr(rawPayload, this, notificationClsType)
      )();
    }
  }
  return BaseResolver;
}
