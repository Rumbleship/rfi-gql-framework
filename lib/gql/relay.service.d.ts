import { Connection, Edge, Node, Oid } from './index';
import { ClassType } from '../helpers/classtype';
import { PubSubEngine } from 'type-graphql';
export interface NodeService<T> {
    getOne(oid: Oid): Promise<T>;
    nodeType(): string;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S>): V;
    setServiceRegister(services: any): void;
}
export interface RelayService<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> extends NodeService<TApi> {
    getAll(filterBy: TFilter, paranoid?: boolean): Promise<TConnection>;
    count(filterBy: TFilter): Promise<number>;
    findOne(filterBy: TFilter, paranoid?: boolean): Promise<TApi | null>;
    getOne(oid: Oid): Promise<TApi>;
    create(data: TInput, pubSub?: PubSubEngine): Promise<TApi>;
    update(data: TUpdate, pubSub?: PubSubEngine): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: any, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>): Promise<TAssocApi | null>;
}
