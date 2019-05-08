import { Resolver, Query, Arg, Args, ID, Mutation, ClassType } from 'type-graphql';
import { RelayService, Node, Connection, Oid } from './index';

/* tslint: disable-next-line */
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
) {
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Resolver({ isAbstract: true })
  abstract class BaseResolver {
    constructor(protected service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>) {}

    @Query(type => connectionTypeCls, { name: `${baseName}s` })
    async getAll(@Args(type => filterClsType) filterBy: TFilter): Promise<TConnection> {
      return this.service.getAll(filterBy);
    }
    @Query(type => objectTypeCls, { name: `${baseName}` })
    async getOne(@Arg('id', type => ID) id: string): Promise<TApi> {
      return this.service.getOne(new Oid(id));
    }
    @Mutation(type => objectTypeCls, { name: `add${capitalizedName}` })
    async create(@Arg('input', type => inputClsType) input: TInput): Promise<TApi> {
      return this.service.create(input);
    }

    @Mutation(type => objectTypeCls, { name: `update${capitalizedName}` })
    async update(@Arg('input', type => updateClsType) input: TUpdate): Promise<TApi> {
      return this.service.update(input);
    }
  }

  return BaseResolver;
}
