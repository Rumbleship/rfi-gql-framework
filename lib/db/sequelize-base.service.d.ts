import { Connection, Edge, Node, Oid, RelayService, NodeService, NodeServiceOptions, NodeServiceTransaction, NodeServiceIsolationLevel } from '../gql';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers/classtype';
import { GqlSingleTableInheritanceFactory } from './model-to-class';
import { Context } from '../server/index';
import { Transaction } from 'sequelize';
declare type ModelClass<T> = new (values?: any, options?: any) => T;
export declare class SequelizeBaseService<TApi extends Node<TApi>, TModel extends Model<TModel>, TEdge extends Edge<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, TDiscriminatorEnum> implements RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
    protected apiClass: ClassType<TApi>;
    protected edgeClass: ClassType<TEdge>;
    protected connectionClass: ClassType<TConnection>;
    protected model: ModelClass<TModel> & typeof Model;
    protected ctx: Context;
    protected apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel> | undefined;
    private nodeServices;
    constructor(apiClass: ClassType<TApi>, edgeClass: ClassType<TEdge>, connectionClass: ClassType<TConnection>, model: ModelClass<TModel> & typeof Model, ctx: Context, apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel> | undefined);
    setServiceRegister(services: any): void;
    nodeType(): string;
    gqlFromDbModel(dbModel: TModel): TApi;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
    newTransaction(isolation?: NodeServiceIsolationLevel): Promise<NodeServiceTransaction>;
    convertServiceOptionsToSequelizeOptions(options?: NodeServiceOptions): {
        paranoid: boolean | undefined;
        transaction: Transaction | undefined;
        lock: Transaction.LOCK | undefined;
    } | undefined;
    getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection>;
    findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | null>;
    findEach(filterBy: TFilter, apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>, options?: NodeServiceOptions): Promise<void>;
    count(filterBy: any): Promise<number>;
    getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi>;
    publishLastKnownState(oid: Oid): Promise<void>;
    create(data: TInput, options?: NodeServiceOptions): Promise<TApi>;
    update(data: TUpdate, options?: NodeServiceOptions): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: any, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>, options?: NodeServiceOptions): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>, options?: NodeServiceOptions): Promise<TAssocApi | null>;
    private makeEdge;
}
export {};
