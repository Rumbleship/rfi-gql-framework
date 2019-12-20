import { Service } from 'typedi';
import { Oid } from '@rumbleship/oid';
import {
  Connection,
  Edge,
  Node,
  RelayService,
  NodeService,
  NodeServiceOptions,
  NodeServiceLock,
  NodeServiceTransaction,
  NodeServiceIsolationLevel,
  NodeServiceTransactionType
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
import { Transaction, FindOptions, Op } from 'sequelize';
import { findEach } from 'iterable-model';
import { Actions, RFIAuthError, Permissions, AuthorizerTreatAsMap, Scopes } from '@rumbleship/acl';
import { createWhereClauseWith } from '../gql/create-where-clause-with';
import {
  createAuthWhereClause,
  getAuthorizeThroughEntries,
  AuthIncludeEntry,
  getAuthorizeContext,
  setAuthorizeContext
} from './create-auth-where-clause';

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
  protected static hooksMap: Set<typeof Model> = new Set();
  private nodeServices: any;
  private permissions: Permissions;
  private spyglassKey: string;
  constructor(
    protected relayClass: ClassType<TApi>,
    protected edgeClass: ClassType<TEdge>,
    protected connectionClass: ClassType<TConnection>,
    protected model: ModelClass<TModel> & typeof Model,
    protected ctx: Context,
    protected options: {
      permissions: Permissions;
      apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    }
  ) {
    this.spyglassKey = relayClass.constructor.name;
    this.permissions = options.permissions;
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        permissions: this.permissions
      }
    });
    // Force authorizations on retrieve from db
    SequelizeBaseService.addAuthCheckHook(model);
  }

  can(params: {
    action: Actions;
    authorizable: object;
    options?: NodeServiceOptions;
    treatAsAuthorizerMap?: AuthorizerTreatAsMap;
  }) {
    return (
      (params.options && (params.options.transaction || params.options.skipAuthorizationCheck)) ||
      this.ctx.authorizer.can(
        params.action,
        params.authorizable,
        this.permissions,
        params.treatAsAuthorizerMap
      )
    );
  }

  setAuthorizeContext(target: object, nodeServiceOptions: NodeServiceOptions) {
    return setAuthorizeContext(target, { nodeServiceOptions, service: this });
  }
  /**
   *
   * Called by the hook. Dont call directly
   *
   * @param findOptions
   * @param nodeServiceOptions
   */
  addAuthorizationToWhere(
    findOptions: FindOptions,
    nodeServiceOptions?: NodeServiceOptions
  ): FindOptions {
    if (!nodeServiceOptions?.skipAuthorizationCheck) {
      const whereAuthClause = createAuthWhereClause(
        this.permissions,
        this.ctx.authorizer,
        this.relayClass.prototype
      );
      // any associated objects that must be scanned?
      const authThroughEntries = getAuthorizeThroughEntries(this.relayClass.prototype);
      const eagerLoads: AuthIncludeEntry[] = [];
      let includedWhereAuthClause = {};
      for (const authEntry of authThroughEntries) {
        includedWhereAuthClause = {
          ...includedWhereAuthClause,
          ...createAuthWhereClause(
            this.permissions,
            this.ctx.authorizer,
            authEntry.targetClass().prototype,
            authEntry.associationName
          )
        };
        // We must also eager load the association to ensure that it is in scope of the where
        const assocModel = this.getServiceFor(
          authEntry.targetClass() as any
        ).dbModel() as ClassType<Model> & typeof Model;
        eagerLoads.push({
          model: assocModel,
          as: authEntry.associationName
        });
      }

      // [sequelize.literal('`TheAlias->RecipeIngredient`.amount'), 'amount']
      findOptions.where = {
        ...findOptions.where,
        ...{ [Op.or]: [includedWhereAuthClause, whereAuthClause] }
      };
      if (eagerLoads.length) {
        if (!findOptions.include) {
          findOptions.include = [];
        }
        findOptions.include.push(...eagerLoads);
      }
    }
    return findOptions;
  }

  static addAuthCheckHook(modelClass: typeof Model) {
    // We keep a set of models that have already had a hook added.
    // Its kind of ugly but seems the best way. Although I'm inclined to have a global
    // hook so ALL finds are checked for auth filters...
    //
    // In the meantime... Watch for closures, this gets added once, so dont add anything but static/globals
    // to the members
    // so all of the conext MUST be got form the options object passsed into the find.
    //
    //
    if (!SequelizeBaseService.hooksMap.has(modelClass)) {
      SequelizeBaseService.hooksMap.add(modelClass);
      modelClass.addHook('beforeFind', (findOptions: FindOptions): void => {
        const authorizeContext = getAuthorizeContext(findOptions);
        if (!authorizeContext) {
          throw new Error(
            'SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an authorizeService passed in. See SequelizeBaseService'
          );
        }
        if (!authorizeContext.nodeServiceOptions?.skipAuthorizationCheck) {
          if (!authorizeContext.authApplied) {
            // only do once
            if (!authorizeContext.service.getContext().authorizer.inScope(Scopes.SYSADMIN)) {
              // This is ugly... but not sure how best to accomplish with typesafety
              (authorizeContext.service as any).addAuthorizationToWhere(
                findOptions,
                authorizeContext.nodeServiceOptions
              );
              authorizeContext.authApplied = true;
            }
          }
        }
      });
    }
  }

  setServiceRegister(services: any): void {
    this.nodeServices = services;
  }
  nodeType(): string {
    return this.relayClass.constructor.name;
  }
  gqlFromDbModel(dbModel: TModel): TApi {
    if (this.options.apiClassFactory) {
      return this.options.apiClassFactory.makeFrom(dbModel, this);
    } else {
      return modelToClass(this, this.relayClass, dbModel);
    }
  }
  dbModel(): ClassType<TModel> {
    return this.model;
  }

  getContext(): Context {
    return this.ctx;
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
    type?: NodeServiceTransactionType;
  }): Promise<NodeServiceTransaction> {
    const txn = await this.model.sequelize!.transaction({
      isolationLevel: params.isolation as any,
      autocommit: params.autocommit,
      type: params.type as any
    });
    this.ctx.logger.addMetadata({
      txn: { id: (txn as any).id, options: (txn as any).options }
    });
    this.ctx.logger.info('transaction_started');
    return (txn as unknown) as NodeServiceTransaction;
  }

  async endTransaction(
    transaction: NodeServiceTransaction,
    action: 'commit' | 'rollback'
  ): Promise<void> {
    switch (action) {
      case 'commit':
        this.ctx.logger.info('transaction_commit');
        return transaction.commit();
      case 'rollback':
        this.ctx.logger.info('transaction_rollback');
        return transaction.rollback();
    }
  }

  convertServiceOptionsToSequelizeOptions(options?: NodeServiceOptions) {
    if (options) {
      const transaction: Transaction | undefined = options
        ? ((options.transaction as unknown) as Transaction)
        : undefined;
      let lock: any | undefined;
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
    /*if (
      this.can({
        action: Actions.QUERY,
        authorizable: filter as any,
        options
      })
    ) {*/

    const limits = calculateLimitAndOffset(after, first, before, last);
    const whereClause = createWhereClauseWith(filter);
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options) ?? {};
    const findOptions: FindOptions = {
      where: whereClause,
      offset: limits.offset,
      limit: limits.limit,
      ...sequelizeOptions
    };
    this.setAuthorizeContext(findOptions, options ?? {});

    const { rows, count } = await this.model.findAndCountAll(findOptions);
    // prime the cache
    // this.sequelizeDataloaderCtx.prime(rows);
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    const edges: Array<Edge<TApi>> = rows.map(instance =>
      this.makeEdge(toBase64(limits.offset++), this.gqlFromDbModel(instance as any))
    );

    connection.addEdges(edges, pageAfter, pageBefore);

    return connection;
  }
  async findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | null> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        findOne: { filterBy }
      }
    });

    const matched = await this.getAll(filterBy, options);
    if (matched.edges.length) {
      return matched.edges[0].node;
    }

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

    const whereClause = createWhereClauseWith(filter);
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: whereClause,
      ...sequelizeOptions
    };
    this.setAuthorizeContext(findOptions, options ?? {});

    const modelFindEach = findEach.bind(this.model);
    return modelFindEach(findOptions, (model: TModel) => {
      const apiModel = this.gqlFromDbModel(model);
      return apply(apiModel, options);
    });
  }

  async count(filterBy: any, options?: NodeServiceOptions) {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        count: { filterBy }
      }
    });
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: filterBy,
      ...sequelizeOptions
    };
    this.setAuthorizeContext(findOptions, options ?? {});
    return this.model.count(findOptions);
  }

  async getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        getOne: { ...oid, id: oid.unwrap().id, scope: oid.unwrap().scope }
      }
    });
    const { id } = oid.unwrap();
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: { id },
      ...sequelizeOptions
    };
    this.setAuthorizeContext(findOptions, options ?? {});

    const instance = await this.model.findOne(findOptions);
    if (!instance) {
      throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
    }
    return this.gqlFromDbModel(instance as any);
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

    const findOptions: FindOptions = {
      where: { id }
    };
    this.setAuthorizeContext(findOptions, {});
    const instance = await this.model.findOne(findOptions);
    if (!instance) {
      throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
    }
    publishCurrentState(instance);
  }

  // Unsure how or where to add the create|update data in a "safe" way here, generically -- so skipping for now.
  async create(data: TInput, options?: NodeServiceOptions): Promise<TApi> {
    if (
      this.can({
        action: Actions.CREATE,
        authorizable: data as any,
        options
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
    // TODO sort this one through for permissions

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
        oid = Oid.Create(gqlModelName, node.id);
      } else {
        // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
        throw new Error(`Invalid ${this.relayClass.name}: No id`);
      }
    } else {
      if ((data as any).id) {
        oid = new Oid((data as any).id.toString());
        const { id } = oid.unwrap();
        const findOptions: FindOptions = {
          where: { id },
          ...sequelizeOptions
        };
        this.setAuthorizeContext(findOptions, options ?? {});

        node = await this.model.findOne(findOptions);
        if (!node) {
          throw new Error(`Invalid ${this.relayClass.name}: No id`);
        }
      } else {
        // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
        throw new Error(`Invalid ${this.relayClass.name}: No id`);
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
    // TODO @mathenshall this needs to be slightly different, as there may be associated authorizables
    //
    if (
      this.can({
        action: Actions.UPDATE,
        authorizable: node as any,
        options
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
    const whereClause = createWhereClauseWith(filter);
    let sourceModel: Model<Model<any>>;
    let count = 0;
    let associated: Array<Model<any>>;
    if (modelKey in source) {
      sourceModel = Reflect.get(source, modelKey);
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      let findOptions: FindOptions = {
        where: whereClause
      };
      this.setAuthorizeContext(findOptions, options ?? {});
      count = await sourceModel.$count(assoc_key, findOptions);
      findOptions = {
        ...findOptions,
        offset: limits.offset,
        limit: limits.limit,
        ...sequelizeOptions
      };
      const result = await sourceModel.$get(assoc_key as any, findOptions);
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
    const sequelizeOptions: FindOptions =
      this.convertServiceOptionsToSequelizeOptions(options) ?? {};

    this.setAuthorizeContext(sequelizeOptions, options ?? {});

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
