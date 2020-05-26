import { Order } from 'sequelize';
import { RumbleshipContext } from './../server/rumbleship-context';
import { Oid } from '@rumbleship/oid';
// tslint:disable-next-line: no-circular-imports
import { Connection, Edge, Node } from './index';
import { ClassType } from '../helpers/classtype';
import { Actions } from '@rumbleship/acl';

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

/**
 * paranoid?: boolean; Include 'deleted' records
 * transaction?: NodeServiceTransaction;
 * lockLevel?: NodeServiceLock;
 * skipAuthorizationCheck?: boolean; Dont do any authorization checks...
 * action?: Actions;  // Authorization action to use for authorization queries. Defaults to Actions.Query
 */
export interface NodeServiceOptions {
  paranoid?: boolean;
  transaction?: NodeServiceTransaction;
  lockLevel?: NodeServiceLock;
  skipAuthorizationCheck?: boolean;
  action?: Actions;
}

export interface NodeService<T extends Node<T>> {
  getOne(oid: Oid, options?: NodeServiceOptions): Promise<T>;
  nodeType(): string;
  getContext(): RumbleshipContext;
  getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
  setServiceRegister(services: any): void;
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
  findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | undefined>;
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
    options?: NodeServiceOptions,
    order?: Order
  ): Promise<TAssocConnection>;
  getAssociated<TAssocApi extends Node<TAssocApi>>(
    source: TApi,
    assoc_key: string,
    assocApiClass: ClassType<TAssocApi>,
    options?: NodeServiceOptions
  ): Promise<TAssocApi | undefined>;
}
