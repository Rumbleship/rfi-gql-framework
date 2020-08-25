import { Model } from 'sequelize-typescript';
import { ClassType } from '../../helpers';
import { Node, Connection, RelayService, NodeServiceOptions } from '../../gql';
export declare type ModelClass<T> = new (values?: any, options?: any) => T;
export interface SequelizeBaseServiceInterface<TApi extends Node<TApi> = any, TModel extends Model<TModel> = any, TConnection extends Connection<TApi> = any, TFilter = any, TInput = any, TUpdate = any> extends RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
    dbModel(): ModelClass<TModel> & typeof Model;
    gqlFromDbModel(dao: object): TApi;
    dbModelFromGql(relayObject: TApi): TModel;
    addAuthorizationFilters(findOptions: object, nodeServiceOptions: NodeServiceOptions, authorizableClass?: ClassType<any>, forCountQuery?: boolean): object;
}
