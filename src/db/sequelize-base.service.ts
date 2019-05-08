import { Service } from 'typedi';
import { EXPECTED_OPTIONS_KEY } from 'dataloader-sequelize';
import { Connection, Edge, Node, Oid, RelayService, NodeService } from '../gql';
import { calculateBeforeAndAfter, calculateLimitAndOffset, modelToClass, modelKey } from './index';

import { Model } from 'sequelize-typescript';

import { toBase64 } from '../helpers/base64';
import { ClassType } from '../helpers/classtype';

type ModelClass<T> = new (values?: any, options?: any) => T;
@Service()
export class SequelizeBaseService<
  TApi extends Node<TApi>,
  TModel,
  TEdge extends Edge<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> implements RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
  private nodeServices: any;
  constructor(
    private apiClass: ClassType<TApi>,
    private edgeClass: ClassType<TEdge>,
    private connectionClass: ClassType<TConnection>,
    private model: ModelClass<TModel> & typeof Model,
    protected sequelizeDataloaderCtx: any
  ) {}
  setServiceRegister(services: any): void {
    this.nodeServices = services;
  }
  nodeType(): string {
    return this.apiClass.constructor.name;
  }
  getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S>): V {
    if (cls.name in this.nodeServices) {
      return Reflect.get(this.nodeServices, cls.name);
    }
    throw Error(`Service not defined for Class: ${cls.name}`);
  }
  async getAll(filterBy: TFilter): Promise<TConnection> {
    const { after, before, first, last, ...filter } = filterBy as any;
    // we hold cursors as base64 of the offset for this query... not perfect,
    // but good enough for now
    // see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
    // However... we only support before OR after.
    //
    const limits = calculateLimitAndOffset(after, first, before, last);
    const whereClause = Oid.createWhereClauseWith(filter);

    const { rows, count } = await this.model.findAndCountAll({
      where: whereClause,
      offset: limits.offset,
      limit: limits.limit,
      [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
    });
    // prime the cache
    // this.sequelizeDataloaderCtx.prime(rows);
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    const edges: Array<Edge<TApi>> = rows.map(instance =>
      this.makeEdge(toBase64(limits.offset++), modelToClass(this, this.apiClass, instance))
    );
    const connection = new this.connectionClass();
    connection.addEdges(edges, pageAfter, pageBefore);
    return connection;
  }
  async count(filterBy: any) {
    return this.model.count({
      where: filterBy
    });
  }

  async getOne(oid: Oid): Promise<TApi> {
    const { id } = oid.unwrap();
    const instance = await this.model.findByPk(id, {
      [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
    });
    if (!instance) {
      throw new Error(`${this.apiClass.constructor.name}: oid(${id}) not found`);
    }
    return modelToClass(this, this.apiClass, instance);
  }

  async create(data: TInput): Promise<TApi> {
    const instance = await this.model.create(data as any);
    return modelToClass(this, this.apiClass, instance);
  }

  async update(data: TUpdate): Promise<TApi> {
    if ((data as any).id) {
      const { id } = new Oid((data as any).id).unwrap();

      delete (data as any).id;

      const node = await this.model.findByPk(id, {
        [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
      });

      if (!node) {
        throw new Error('Account not found');
      }
      await node.update(data as any);
      return modelToClass(this, this.apiClass, node);
    }
    throw new Error(`Invalid ${this.apiClass.name}: No id`);
  }

  /* <TAssocApi extends Node,
    TAssocConnection extends Connection<TAssocApi>,
    TAssocEdge extends Edge<TAssocApi>,
    TAssocModel
    > */
  async getAssociatedMany<
    TAssocApi extends Node<TAssocApi>,
    TAssocConnection extends Connection<TAssocApi>,
    TAssocEdge extends Edge<TAssocApi>
  >(
    source: TApi,
    assoc_key: string,
    filterBy: any,
    assocApiClass: ClassType<TAssocApi>,
    assocEdgeClass: ClassType<TAssocEdge>,
    assocConnectionClass: ClassType<TAssocConnection>
  ): Promise<TAssocConnection> {
    const { after, before, first, last, ...filter } = filterBy;
    const limits = calculateLimitAndOffset(after, first, before, last);
    const whereClause = Oid.createWhereClauseWith(filter);
    let sourceModel: Model<Model<any>>;
    let count = 0;
    let associated: Array<Model<any>>;
    if (modelKey in source) {
      sourceModel = Reflect.get(source, modelKey);
      count = await sourceModel.$count(assoc_key, {
        where: whereClause,
        [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
      });
      const result = await sourceModel.$get(assoc_key as any, {
        offset: limits.offset,
        limit: limits.limit,
        where: whereClause,
        [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
      });
      result instanceof Array ? (associated = result) : (associated = [result]);
    } else {
      throw new Error(`Invalid ${source.constructor.name}`);
    }
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    let edges: Array<Edge<TAssocApi>>;

    edges = associated.map(instance => {
      const edge = new assocEdgeClass();
      edge.cursor = toBase64(limits.offset++);
      edge.node = modelToClass(this.getServiceFor(assocApiClass), assocApiClass, instance);
      return edge;
    });
    const connection = new assocConnectionClass();
    connection.addEdges(edges, pageAfter, pageBefore);
    return connection;
  }

  async getAssociated<TAssocApi extends Node<TAssocApi>>(
    source: TApi,
    assoc_key: string,
    assocApiClass: ClassType<TAssocApi>
  ): Promise<TAssocApi | null> {
    if (assoc_key in source) {
      const ret = Reflect.get(source, assoc_key);
      if (ret instanceof assocApiClass) {
        return ret;
      } else {
        throw new Error(`Invalid associated type for ${assoc_key}`);
      }
    }
    if (!(modelKey in source)) {
      throw new Error(`Invalid ${source.constructor.name}`);
    }
    const sourceModel = Reflect.get(source, modelKey) as Model<Model<any>>;
    const associatedModel = (await sourceModel.$get(assoc_key as any, {
      [EXPECTED_OPTIONS_KEY]: this.sequelizeDataloaderCtx
    })) as Model<Model<any>>;
    if (associatedModel) {
      Reflect.set(
        source,
        assoc_key,
        modelToClass(this.getServiceFor(assocApiClass), assocApiClass, associatedModel)
      );
      return Reflect.get(source, assoc_key);
    }
    return null;
  }

  private makeEdge(cursor: string, node: TApi): TEdge {
    const edge = new this.edgeClass();
    edge.cursor = cursor;
    edge.node = node;
    return edge;
  }
}
