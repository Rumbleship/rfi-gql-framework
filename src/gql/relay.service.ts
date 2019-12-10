import { Context } from './../server/context.interface';
import { Oid } from '@rumbleship/oid';
import { Connection, Edge, Node } from './index';
import { ClassType } from '../helpers/classtype';

export interface NodeServiceTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  afterCommit(fn: (transaction: this) => void | Promise<void>): void;
}
export enum NodeServiceLock {
  UPDATE = 'UPDATE',
  SHARE = 'SHARE'
}
export enum NodeServiceIsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE'
}
export enum NodeServiceTransactionType {
  DEFERRED = 'DEFERRED',
  IMMEDIATE = 'IMMEDIATE',
  EXCLUSIVE = 'EXCLUSIVE'
}

export interface NodeServiceOptions {
  paranoid?: boolean;
  transaction?: NodeServiceTransaction;
  lockLevel?: NodeServiceLock;
  skipAuthorizationCheck?: boolean;
}

export interface NodeService<T> {
  getOne(oid: Oid, options?: NodeServiceOptions): Promise<T>;
  nodeType(): string;
  getContext(): Context;
  getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
  setServiceRegister(services: any): void;
  gqlFromDbModel(dao: object): T;
  publishLastKnownState(oid: Oid): Promise<void>;
  newTransaction(params: {
    isolation: NodeServiceIsolationLevel;
    autocommit: boolean;
    type?: NodeServiceTransactionType;
  }): Promise<NodeServiceTransaction>;
  endTransaction(transaction: NodeServiceTransaction, action: 'commit' | 'rollback'): Promise<void>;
}

export interface RelayService<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> extends NodeService<TApi> {
  getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection>;
  count(filterBy: any, options?: NodeServiceOptions): Promise<number>;
  findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | null>;
  findEach(
    filterBy: TFilter,
    apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>,
    options?: NodeServiceOptions
  ): Promise<void>;
  getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi>;
  create(data: TInput, options?: NodeServiceOptions): Promise<TApi>;
  update(data: TUpdate, options?: NodeServiceOptions, target?: TApi): Promise<TApi>;
  getAssociatedMany<
    TAssocApi extends Node<TAssocApi>,
    TAssocConnection extends Connection<TAssocApi>,
    TAssocEdge extends Edge<TAssocApi>
  >(
    source: TApi,
    assoc_key: string,
    filterBy: any,
    assocApiClass: ClassType<TAssocApi>,
    assocEdgeClass: ClassType<TAssocEdge>,
    assocConnectionClass: ClassType<TAssocConnection>,
    options?: NodeServiceOptions
  ): Promise<TAssocConnection>;
  getAssociated<TAssocApi extends Node<TAssocApi>>(
    source: TApi,
    assoc_key: string,
    assocApiClass: ClassType<TAssocApi>,
    options?: NodeServiceOptions
  ): Promise<TAssocApi | null>;
}
