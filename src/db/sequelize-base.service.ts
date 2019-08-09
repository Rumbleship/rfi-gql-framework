import { Service } from 'typedi';
import {
  Connection,
  Edge,
  Node,
  Oid,
  RelayService,
  NodeService,
  NodeServiceOptions,
  NodeServiceLock,
  NodeServiceTransaction,
  NodeServiceIsolationLevel
} from '../gql';
import { calculateBeforeAndAfter, calculateLimitAndOffset } from './index';

import { Model } from 'sequelize-typescript';

import { toBase64 } from '../helpers/base64';
import { ClassType } from '../helpers/classtype';
import {
  GqlSingleTableInheritanceFactory,
  modelToClass,
  modelKey,
  reloadNodeFromModel
} from './model-to-class';
import { Context } from '../server/index';
import { publishCurrentState } from './gql-pubsub-sequelize-engine';
import { Transaction } from 'sequelize';
import { findEach } from 'iterable-model';
import { PermissionsMatrix, Actions, RFIAuthError, Resource } from '@rumbleship/acl';

type ModelClass<T> = new (values?: any, options?: any) => T;
@Service()
export class SequelizeBaseService<
  TApi extends Node<TApi>,
  TModel extends Model<TModel>,
  TEdge extends Edge<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate,
  TDiscriminatorEnum
> implements RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
  private nodeServices: any;
  private permissions: PermissionsMatrix;
  private spyglassKey: string;
  constructor(
    protected apiClass: ClassType<TApi>,
    protected edgeClass: ClassType<TEdge>,
    protected connectionClass: ClassType<TConnection>,
    protected model: ModelClass<TModel> & typeof Model,
    protected ctx: Context,
    protected options: {
      permissions: PermissionsMatrix;
      apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    }
  ) {
    this.spyglassKey = apiClass.constructor.name;
    this.permissions = options.permissions;
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        permissions: this.permissions
      }
    });
  }

  can(params: {
    action: Actions;
    authorizable: object;
    options?: NodeServiceOptions;
    attribute?: string | string[];
    resource?: Resource;
  }) {
    return (
      (params.options && (params.options.transaction || params.options.skipAuthorizationCheck)) ||
      this.ctx.authorizer.can(
        params.action,
        params.authorizable,
        [this.permissions],
        // stopgap fix until we upgrade @rumbleship/acl for compatibility with attribute possibly being string[]
        params.attribute
          ? Array.isArray(params.attribute)
            ? params.attribute[0]
            : params.attribute
          : undefined,
        params.resource
      )
    );
  }

  setServiceRegister(services: any): void {
    this.nodeServices = services;
  }
  nodeType(): string {
    return this.apiClass.constructor.name;
  }
  gqlFromDbModel(dbModel: TModel): TApi {
    if (this.options.apiClassFactory) {
      return this.options.apiClassFactory.makeFrom(dbModel, this);
    } else {
      return modelToClass(this, this.apiClass, dbModel);
    }
  }

  getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V {
    const name = typeof cls === 'string' ? cls : cls.name;
    if (name in this.nodeServices) {
      return Reflect.get(this.nodeServices, name);
    }
    throw Error(`Service not defined for Class: ${name}`);
  }

  async newTransaction(params: {
    isolation: NodeServiceIsolationLevel;
    autocommit: boolean;
  }): Promise<NodeServiceTransaction> {
    const txn = await this.model.sequelize!.transaction({
      isolationLevel: params.isolation as any,
      autocommit: params.autocommit
    });
    this.ctx.logger.addMetadata({
      txn: { id: (txn as any).id, options: (txn as any).options }
    });
    return (txn as unknown) as NodeServiceTransaction;
  }

  convertServiceOptionsToSequelizeOptions(options?: NodeServiceOptions) {
    if (options) {
      const transaction: Transaction | undefined = options
        ? ((options.transaction as unknown) as Transaction)
        : undefined;
      let lock: Transaction.LOCK | undefined;
      if (transaction) {
        lock = options.lockLevel
          ? options.lockLevel === NodeServiceLock.UPDATE
            ? Transaction.LOCK.UPDATE
            : Transaction.LOCK.SHARE
          : undefined;
      }
      return { paranoid: options.paranoid, transaction, lock };
    } else {
      return undefined;
    }
  }
  async getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection> {
    const { after, before, first, last, ...filter } = filterBy as any;
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        getAll: { filterBy }
      }
    });
    // we hold cursors as base64 of the offset for this query... not perfect,
    // but good enough for now
    // see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
    // However... we only support before OR after.
    //
    const connection = new this.connectionClass();
    const attribute = Reflect.get(this, Symbol.for(`getAllAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`getAllAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: filter as any,
        options,
        attribute,
        resource
      })
    ) {
      const limits = calculateLimitAndOffset(after, first, before, last);
      const whereClause = Oid.createWhereClauseWith(filter);
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      const { rows, count } = await this.model.findAndCountAll({
        where: whereClause,
        offset: limits.offset,
        limit: limits.limit,
        ...sequelizeOptions
      });
      // prime the cache
      // this.sequelizeDataloaderCtx.prime(rows);
      const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
      const edges: Array<Edge<TApi>> = rows.map(instance =>
        this.makeEdge(toBase64(limits.offset++), this.gqlFromDbModel(instance as any))
      );

      connection.addEdges(edges, pageAfter, pageBefore);
    } else {
      this.ctx.logger.info('sequelize_base_service_authorization_denied', {
        [this.spyglassKey]: {
          method: 'getAll'
        }
      });
      connection.addEdges([], false, false);
    }
    return connection;
  }
  async findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | null> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        findOne: { filterBy }
      }
    });
    const { ...filter } = filterBy;
    const attribute = Reflect.get(this, Symbol.for(`findOneAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`findOneAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: filter as any,
        options,
        attribute,
        resource
      })
    ) {
      const matched = await this.getAll(filterBy, options);
      if (matched.edges.length) {
        return matched.edges[0].node;
      }
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'findOne'
      }
    });
    return null;
  }

  async findEach(
    filterBy: TFilter,
    apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>,
    options?: NodeServiceOptions
  ): Promise<void> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        findEach: { filterBy }
      }
    });
    const { after, before, first, last, ...filter } = filterBy as any;
    const attribute = Reflect.get(this, Symbol.for(`findEachAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`findEachAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: filter as any,
        options,
        resource,
        attribute
      })
    ) {
      const whereClause = Oid.createWhereClauseWith(filter);
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      const modelFindEach = findEach.bind(this.model);
      return modelFindEach(
        {
          where: whereClause,
          ...sequelizeOptions
        },
        (model: TModel) => {
          const apiModel = this.gqlFromDbModel(model);
          return apply(apiModel, options);
        }
      );
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'findEach'
      }
    });
    throw new RFIAuthError();
  }

  async count(filterBy: any, options?: NodeServiceOptions) {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        count: { filterBy }
      }
    });
    const { ...filter } = filterBy;
    const attribute = Reflect.get(this, Symbol.for(`countAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`countAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: filter as any,
        options,
        attribute,
        resource
      })
    ) {
      return this.model.count({
        where: filterBy
      });
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'count'
      }
    });
    throw new RFIAuthError();
  }

  async getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        getOne: { ...oid, id: oid.unwrap().id, scope: oid.unwrap().scope }
      }
    });
    const { id } = oid.unwrap();
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const instance = await this.model.findByPk(id, sequelizeOptions);
    if (!instance) {
      throw new Error(`${this.apiClass.constructor.name}: oid(${oid}) not found`);
    }
    const attribute = Reflect.get(this, Symbol.for(`getOneAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`getOneAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: instance,
        options,
        resource,
        attribute
      })
    ) {
      return this.gqlFromDbModel(instance as any);
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'getOne'
      }
    });
    throw new RFIAuthError();
  }

  async publishLastKnownState(oid: Oid): Promise<void> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        publishLastKnownState: {
          ...oid,
          id: oid.unwrap().id,
          scope: oid.unwrap().scope
        }
      }
    });
    const { id } = oid.unwrap();
    const instance = await this.model.findByPk(id);
    if (!instance) {
      throw new Error(`${this.apiClass.constructor.name}: oid(${oid}) not found`);
    }
    const attribute = Reflect.get(this, Symbol.for(`publishLastKnownStateAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`publishLastKnownStateAuthorizedResource`));
    if (
      this.can({
        action: Actions.QUERY,
        authorizable: instance,
        attribute,
        resource
      })
    ) {
      publishCurrentState(instance);
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'publishLastKnownState'
      }
    });
    throw new RFIAuthError();
  }

  // Unsure how or where to add the create|update data in a "safe" way here, generically -- so skipping for now.
  async create(data: TInput, options?: NodeServiceOptions): Promise<TApi> {
    const attribute = Reflect.get(this, Symbol.for(`createAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`createAuthorizedResource`));
    if (
      this.can({
        action: Actions.CREATE,
        authorizable: data as any,
        options,
        attribute,
        resource
      })
    ) {
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      const instance = await this.model.create(data as any, sequelizeOptions);
      return this.gqlFromDbModel(instance as any);
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied', {
      [this.spyglassKey]: {
        method: 'create'
      }
    });
    throw new RFIAuthError();
  }
  /**
   *
   * @param data - data to uipdate
   * @param options - may include a transaction
   * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
   */
  async update(data: TUpdate, options?: NodeServiceOptions, target?: TApi): Promise<TApi> {
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    let node;
    let oid;
    if (target) {
      // we already have the id and should have the model that was loaded
      // this resolves issues with transactional query for update and stops having to go back and reload
      if (modelKey in target) {
        node = Reflect.get(target, modelKey);
        const gqlModelName = node.constructor.name.slice(
          0,
          node.constructor.name.length - 'Model'.length
        );
        oid = Oid.create(gqlModelName, node.id);
      } else {
        // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
        throw new Error(`Invalid ${this.apiClass.name}: No id`);
      }
    } else {
      if ((data as any).id) {
        oid = new Oid((data as any).id.toString());
        const { id } = oid.unwrap();
        node = await this.model.findByPk(id, sequelizeOptions);
      } else {
        // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
        throw new Error(`Invalid ${this.apiClass.name}: No id`);
      }
    }
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        update: {
          ...oid,
          id: oid.unwrap().id,
          scope: oid.unwrap().scope
        }
      }
    });
    delete (data as any).id;
    // TODO(@isparling) given moving of the throws around, this check should no longer be needed.

    const attribute = Reflect.get(this, Symbol.for(`updateAuthorizedAttribute`));
    const resource = Reflect.get(this, Symbol.for(`updateAuthorizedResource`));
    if (
      this.can({
        action: Actions.UPDATE,
        authorizable: node as any,
        options,
        attribute,
        resource
      })
    ) {
      await node.update(data as any, sequelizeOptions);
      if (target) {
        await reloadNodeFromModel(target, false);
        return target;
      } else {
        return this.gqlFromDbModel(node as any);
      }
    } else {
      this.ctx.logger.info('sequelize_base_service_authorization_denied', {
        [this.spyglassKey]: {
          method: 'update'
        }
      });
      throw new RFIAuthError();
    }
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
    assocConnectionClass: ClassType<TAssocConnection>,
    options?: NodeServiceOptions
  ): Promise<TAssocConnection> {
    const { after, before, first, last, ...filter } = filterBy;
    const limits = calculateLimitAndOffset(after, first, before, last);
    const whereClause = Oid.createWhereClauseWith(filter);
    let sourceModel: Model<Model<any>>;
    let count = 0;
    let associated: Array<Model<any>>;
    if (modelKey in source) {
      sourceModel = Reflect.get(source, modelKey);
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      count = await sourceModel.$count(assoc_key, {
        where: whereClause
      });
      const result = await sourceModel.$get(assoc_key as any, {
        offset: limits.offset,
        limit: limits.limit,
        where: whereClause,
        ...sequelizeOptions
      });
      result instanceof Array ? (associated = result) : (associated = [result]);
    } else {
      throw new Error(`Invalid ${source.constructor.name}`);
    }
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    // TODO TODO TODO - need to put this in the associated service... and know what
    // type its creating
    //
    let edges: Array<Edge<TAssocApi>>;

    edges = associated.map(instance => {
      const edge = new assocEdgeClass();
      edge.cursor = toBase64(limits.offset++);
      edge.node = this.getServiceFor(assocApiClass).gqlFromDbModel(instance);
      return edge;
    });
    const connection = new assocConnectionClass();
    connection.addEdges(edges, pageAfter, pageBefore);
    return connection;
  }

  async getAssociated<TAssocApi extends Node<TAssocApi>>(
    source: TApi,
    assoc_key: string,
    assocApiClass: ClassType<TAssocApi>,
    options?: NodeServiceOptions
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
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const associatedModel = (await sourceModel.$get(assoc_key as any, sequelizeOptions)) as Model<
      Model<any>
    >;
    if (associatedModel) {
      Reflect.set(
        source,
        assoc_key,
        this.getServiceFor(assocApiClass).gqlFromDbModel(associatedModel)
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
