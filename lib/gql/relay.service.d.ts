import { Connection, Edge, Node, Oid } from './index';
import { ClassType } from '../helpers/classtype';
export interface NodeService<T> {
    getOne(oid: Oid): Promise<T>;
    nodeType(): string;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
    setServiceRegister(services: any): void;
    gqlFromDao(dao: object): T;
}
export interface RelayService<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> extends NodeService<TApi> {
    getAll(filterBy: TFilter, paranoid?: boolean): Promise<TConnection>;
    count(filterBy: TFilter): Promise<number>;
    findOne(filterBy: TFilter, paranoid?: boolean): Promise<TApi | null>;
    getOne(oid: Oid): Promise<TApi>;
    create(data: TInput): Promise<TApi>;
    update(data: TUpdate): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: any, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>): Promise<TAssocApi | null>;
}
