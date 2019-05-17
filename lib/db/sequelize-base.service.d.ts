import { Connection, Edge, Node, Oid, RelayService, NodeService } from '../gql';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers/classtype';
declare type ModelClass<T> = new (values?: any, options?: any) => T;
export declare class SequelizeBaseService<TApi extends Node<TApi>, TModel, TEdge extends Edge<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> implements RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
    private apiClass;
    private edgeClass;
    private connectionClass;
    private model;
    protected sequelizeDataloaderCtx: any;
    private nodeServices;
    constructor(apiClass: ClassType<TApi>, edgeClass: ClassType<TEdge>, connectionClass: ClassType<TConnection>, model: ModelClass<TModel> & typeof Model, sequelizeDataloaderCtx: any);
    setServiceRegister(services: any): void;
    nodeType(): string;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S>): V;
    getAll(filterBy: TFilter, paranoid?: boolean): Promise<TConnection>;
    findOne(filterBy: TFilter, paranoid?: boolean): Promise<TApi | null>;
    count(filterBy: any): Promise<number>;
    getOne(oid: Oid): Promise<TApi>;
    create(data: TInput): Promise<TApi>;
    update(data: TUpdate): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: any, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>): Promise<TAssocApi | null>;
    private makeEdge;
}
export {};
