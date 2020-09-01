import { Model } from 'sequelize-typescript';
import { ClassType } from '../../helpers';
import { Node, Connection, RelayService, NodeServiceOptions } from '../../gql';
import { FindOptions } from 'sequelize';
export type ModelClass<T> = new (values?: any, options?: any) => T;
export interface SequelizeBaseServiceInterface<
  TApi extends Node<TApi> = any,
  TModel extends Model<TModel> = any,
  TConnection extends Connection<TApi> = any,
  TFilter = any,
  TInput = any,
  TUpdate = any
> extends RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
  dbModel(): ModelClass<TModel> & typeof Model;
  gqlFromDbModel(dao: TModel): TApi;
  dbModelFromGql(relayObject: TApi): TModel;
  addAuthorizationFilters(
    findOptions: FindOptions,
    nodeServiceOptions: NodeServiceOptions,
    authorizableClass?: ClassType<Record<string, any>>,
    forCountQuery?: boolean
  ): FindOptions;
}
