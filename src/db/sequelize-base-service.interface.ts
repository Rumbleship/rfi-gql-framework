import { ClassType } from './../helpers/classtype';
import { Model } from 'sequelize-typescript';
import { RelayService, NodeServiceOptions } from './../gql/relay.service';
import { Connection } from './../gql/connection.type';
import { Node } from '../gql/node.interface';
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
  gqlFromDbModel(dao: object): TApi;
  addAuthorizationFilters(
    findOptions: object,
    nodeServiceOptions: NodeServiceOptions,
    authorizableClass?: ClassType<any>,
    forCountQuery?: boolean
  ): object;
}
