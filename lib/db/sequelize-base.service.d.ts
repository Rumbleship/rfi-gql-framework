import { Oid } from '@rumbleship/oid';
import { Connection, Edge, Node, RelayService, NodeService, NodeServiceOptions, NodeServiceTransaction, NodeServiceIsolationLevel, NodeServiceTransactionType } from '../gql';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers/classtype';
import { GqlSingleTableInheritanceFactory } from './model-to-class';
import { Context } from '../server/index';
import { Transaction } from 'sequelize';
import { Actions, Permissions, AuthorizerTreatAsMap } from '@rumbleship/acl';
declare type ModelClass<T> = new (values?: any, options?: any) => T;
export declare class SequelizeBaseService<TApi extends Node<TApi>, TModel extends Model<TModel>, TEdge extends Edge<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, TDiscriminatorEnum> implements RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
    protected apiClass: ClassType<TApi>;
    protected edgeClass: ClassType<TEdge>;
    protected connectionClass: ClassType<TConnection>;
    protected model: ModelClass<TModel> & typeof Model;
    protected ctx: Context;
    protected options: {
        permissions: Permissions;
        apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    };
    private nodeServices;
    private permissions;
    private spyglassKey;
    constructor(apiClass: ClassType<TApi>, edgeClass: ClassType<TEdge>, connectionClass: ClassType<TConnection>, model: ModelClass<TModel> & typeof Model, ctx: Context, options: {
        permissions: Permissions;
        apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    });
    can(params: {
        action: Actions;
        authorizable: object;
        options?: NodeServiceOptions;
        treatAsAuthorizerMap?: AuthorizerTreatAsMap;
    }): boolean | NodeServiceTransaction;
    setServiceRegister(services: any): void;
    nodeType(): string;
    gqlFromDbModel(dbModel: TModel): TApi;
    getContext(): Context;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
    newTransaction(params: {
        isolation: NodeServiceIsolationLevel;
        autocommit: boolean;
        type?: NodeServiceTransactionType;
    }): Promise<NodeServiceTransaction>;
    endTransaction(transaction: NodeServiceTransaction, action: 'commit' | 'rollback'): Promise<void>;
    convertServiceOptionsToSequelizeOptions(options?: NodeServiceOptions): {
        paranoid: boolean | undefined;
        transaction: Transaction | undefined;
        lock: Transaction.LOCK | undefined;
    } | undefined;
    getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection>;
    findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | null>;
    findEach(filterBy: TFilter, apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>, options?: NodeServiceOptions): Promise<void>;
    count(filterBy: any, options?: NodeServiceOptions): Promise<number>;
    getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi>;
    publishLastKnownState(oid: Oid): Promise<void>;
    create(data: TInput, options?: NodeServiceOptions): Promise<TApi>;
    /**
     *
     * @param data - data to uipdate
     * @param options - may include a transaction
     * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
     */
    update(data: TUpdate, options?: NodeServiceOptions, target?: TApi): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: any, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>, options?: NodeServiceOptions): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>, options?: NodeServiceOptions): Promise<TAssocApi | null>;
    private makeEdge;
}
export {};
