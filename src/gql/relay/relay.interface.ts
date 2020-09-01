import { InterfaceType, Field, ID } from 'type-graphql';
import { Actions } from '@rumbleship/acl';
import { Oid } from '@rumbleship/oid';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ClassType } from '../../helpers';
import { PageInfo } from './page-info.type';
import { DateRange } from '../scalars/daterange.scalar';
import { RelayOrderBy } from '../scalars/relay-order-by.scalar';

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
@InterfaceType({ isAbstract: true })
export abstract class Node<T> {
  @Field(type => ID)
  id!: Oid;

  _service!: NodeService<Node<T>>;
}

export abstract class Edge<T extends Node<T>> {
  node!: T;
  cursor!: string;
}

export class Connection<T extends Node<T>> {
  pageInfo: PageInfo = new PageInfo();
  edges!: Array<Edge<T>>;
  addEdges(edges: Array<Edge<T>>, hasNextPage: boolean, hasPreviousPage: boolean): void {
    if (edges.length === 0) {
      this.pageInfo.setInfo(hasNextPage, hasPreviousPage);
    } else {
      this.pageInfo.setInfo(
        hasNextPage,
        hasPreviousPage,
        edges[0].cursor,
        edges[edges.length - 1].cursor
      );
    }
    this.edges = edges;
    return;
  }
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
  newTransaction(params: {
    isolation: NodeServiceIsolationLevel;
    autocommit: boolean;
    type?: NodeServiceTransactionType;
  }): Promise<NodeServiceTransaction>;
  endTransaction(transaction: NodeServiceTransaction, action: 'commit' | 'rollback'): Promise<void>;
}

/**
 * Defines the standard orderby pagination and timestamp filters
 */
export interface RelayFilterBase<T> {
  // keys to order returned collection by
  order_by?: RelayOrderBy<T>;
  // pagination
  after?: string;
  before?: string;
  first?: number;
  last?: number;
  // timestamps
  created_at?: Date;
  created_between?: DateRange;
  updated_at?: Date;
  updated_between?: DateRange;
  deleted_at?: Date;
  deleted_between?: DateRange;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RelayInputTypeBase<T> {}

export interface RelayService<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter extends RelayFilterBase<TApi>,
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
    filterBy: RelayFilterBase<TAssocApi>,
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
  ): Promise<TAssocApi | undefined>;
}
