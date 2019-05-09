import { Resolver, Query, Arg, Args, Mutation } from 'type-graphql';
import { RelayService, Node, Connection, Oid } from './index';
import { ClassType } from '../helpers/classtype';

export class GQLBaseResolver<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> {
  constructor(protected service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {}
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
  TUpdate
>(
  baseName: string,
  objectTypeCls: ClassType<TApi>,
  connectionTypeCls: ClassType<TConnection>,
  filterClsType: ClassType<TFilter>,
  inputClsType: ClassType<TInput>,
  updateClsType: ClassType<TUpdate>
): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>> {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  class BaseResolver extends GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate> {
    constructor(service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {
      super(service);
    }

    @Query(type => connectionTypeCls, { name: `${baseName}s` })
    async getAll(@Args(type => filterClsType) filterBy: TFilter): Promise<TConnection> {
      return super.getAll(filterBy);
    }
    @Query(type => objectTypeCls, { name: `${baseName}` })
    async getOne(id: string): Promise<TApi> {
      return super.getOne(id);
    }
    @Mutation(type => objectTypeCls, { name: `add${capitalizedName}` })
    async create(@Arg('input', type => inputClsType) input: TInput): Promise<TApi> {
      return super.create(input);
    }
    @Mutation(type => objectTypeCls, { name: `update${capitalizedName}` })
    async update(@Arg('input', type => updateClsType) input: TUpdate): Promise<TApi> {
      return super.update(input);
    }
  }
  return BaseResolver;
}
