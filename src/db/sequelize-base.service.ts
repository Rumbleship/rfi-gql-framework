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

export interface SequelizeBaseServiceInterface<
  TApi extends Node<TApi>,
  TModel extends Model<TModel>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
> extends RelayService<TApi, TConnection, TFilter, TInput, TUpdate> {
  dbModel(): ModelClass<TModel> & typeof Model;
  gqlFromDbModel(dao: object): TApi;
  setAuthorizeContext(target: object, nodeServiceOptions: NodeServiceOptions): object;
}
export function getSequelizeServiceInterfaceFor<
  TApi extends Node<TApi>,
  TModel extends Model<TModel>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate,
  V extends NodeService<TApi>
>(service: V) {
  return (service as unknown) as SequelizeBaseServiceInterface<
    TApi,
    TModel,
    TConnection,
    TFilter,
    TInput,
    TUpdate
  >;
}
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
> implements SequelizeBaseServiceInterface<TApi, TModel, TConnection, TFilter, TInput, TUpdate> {
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
  /**
   *
   * If there is a transaction or skipAuthorizationCheck has been set, returns true. It is assumed
   * that a priror call has been made and the entire 'use-case' is authorized.
   *
   * The 'can' method is primarily used to ensure that the Actions.UPDATE and ACTIONS.CREATE operations
   * are allowed, (and possibly other actions that are not queries).
   *
   * This is tricky, as the data that is used to identify whether the Operation is allowed,
   * may be held on an associated object and could itself be uncommitted or stale. In the case
   * of the create operation, the associated object that is used to test authorization may not
   * of been associated at this point.
   *
   * One way to solve these issues, is that the 'authorizable' object becomes an instance of the
   * Relay Input or Update class, and these classes are decorated with @AuthorizerTreatAs()
   * on the attributes that represent the instance of an authorizable resource.
   *
   * For an update, it is also possible to do a query with Action.UPDATE set...
   *
   */
  can(params: {
    action: Actions;
    authorizable: object;
    options?: NodeServiceOptions;
    treatAsAuthorizerMap?: AuthorizerTreatAsMap;
  }) {
    const can =
      params?.options?.transaction ||
      params?.options?.skipAuthorizationCheck ||
      this.ctx.authorizer.can(
        params.action,
        params.authorizable,
        this.permissions,
        params.treatAsAuthorizerMap
      );
    return can ? true : false;
  }

  /**
   * Connects the options passed into the API to the sequelize options used in a query and the
   * service that is being used.
   *
   * @param target Typically the FindOptions sequelize object passed into a query
   * @param nodeServiceOptions The framework options passed into the API
   */
  setAuthorizeContext(target: object, nodeServiceOptions: NodeServiceOptions) {
    return setAuthorizeContext(target, { nodeServiceOptions, service: this });
  }
  /**
   *
   * Called by the hook. Dont call directly unless you have totally overridden
   * the auth and want to do some special processing...
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
        nodeServiceOptions?.action ?? Actions.QUERY,
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
            nodeServiceOptions?.action ?? Actions.QUERY,
            authEntry.targetClass().prototype,
            authEntry.associationName
          )
        };
        // We must also eager load the association to ensure that it is in scope of the where
        const assocModel = (this.getServiceFor(
          authEntry.targetClass() as any
        ) as any).dbModel() as ClassType<Model> & typeof Model;
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

  /**
   * This should be called ONLY by the service contructor and adds the authorization filter code
   * to the sequelize Model Class.
   *
   * @param modelClass
   */
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
    // there are times (eg unit testing), when we dont want to actually add the hook and the Model is not
    //  initialized so only do this when we have an initialized sequelize model
    //
    if (modelClass.isInitialized) {
      if (!SequelizeBaseService.hooksMap.has(modelClass)) {
        SequelizeBaseService.hooksMap.add(modelClass);
        modelClass.addHook('beforeFind', (findOptions: FindOptions): void => {
          const authorizeContext = getAuthorizeContext(findOptions);
          if (!authorizeContext) {
            throw new Error(
              'SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an authorizeService passed in. See SequelizeBaseService'
            );
          }
          if (
            authorizeContext.authApplied ||
            authorizeContext.nodeServiceOptions?.skipAuthorizationCheck ||
            authorizeContext.service.getContext().authorizer.inScope(Scopes.SYSADMIN)
          ) {
            return;
          }
          (authorizeContext.service as any).addAuthorizationToWhere(
            findOptions,
            authorizeContext.nodeServiceOptions
          );
          authorizeContext.authApplied = true;
        });
      }
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

  dbModel() {
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

  async findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | undefined> {
    this.ctx.logger.addMetadata({
      [this.spyglassKey]: {
        findOne: { filterBy }
      }
    });

    // Authorization done in getAll
    const matched = await this.getAll({ ...filterBy, ...{ limit: 1 } }, options);
    if (matched.edges.length) {
      return matched.edges[0].node;
    }

    return undefined;
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

  /**
   * Authorization on create is against the createInput object OR via the resolver
   * implementation that then overides the default check through skipAuthorization set on
   * nodeServices object
   *
   * If a more sophisticated mechanism is needed, then this method should be overridden
   * in the concreate class
   *
   * @param createInput Parameters to use for input
   * @param options
   */

  async create(createInput: TInput, options?: NodeServiceOptions): Promise<TApi> {
    if (
      this.can({
        action: Actions.CREATE,
        authorizable: createInput as any,
        options
      })
    ) {
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      const instance = await this.model.create(createInput as any, sequelizeOptions);
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
   * NOTE: the @AuthorizeThrough decorator doesnt apply to Updates UNLESS the instance to be updated
   * is retrieved again. THis is a bit hokey and we may want to revisit this functionality
   *
   * But it is tricky as it depends on how we do isolation levels and such like and needs additional experimentation and testing
   * FOr now if there are specific associated objects that provide permissions, then this methid should be overridden
   *
   *
   * @param updateInput - data to uipdate
   * @param options - may include a transaction
   * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
   */
  async update(updateInput: TUpdate, options?: NodeServiceOptions, target?: TApi): Promise<TApi> {
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    let modelInstance;
    let oid;
    const optionsClone: NodeServiceOptions = { ...options, action: Actions.UPDATE };
    // Check the input for permissions first
    // if this fails, we check the target later in the process
    let isAuthorized = optionsClone.skipAuthorizationCheck
      ? true
      : typeof updateInput === 'object'
      ? this.can({ action: Actions.UPDATE, authorizable: updateInput as any, options })
      : false;
    if (target) {
      // we already have the id and should have the model that was loaded
      // this resolves issues with transactional query for update and stops having to go back and reload
      //
      // TODO --- Get the object again with Actions.UPDATE in the query
      //
      if (modelKey in target) {
        modelInstance = Reflect.get(target, modelKey);
        const gqlModelName = modelInstance.constructor.name.slice(
          0,
          modelInstance.constructor.name.length - 'Model'.length
        );
        oid = Oid.Create(gqlModelName, modelInstance.id);
      } else {
        // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
        throw new Error(`Invalid ${this.relayClass.name}: No id`);
      }
    } else {
      if ((updateInput as any).id) {
        oid = new Oid((updateInput as any).id.toString());
        const { id } = oid.unwrap();
        const findOptions: FindOptions = {
          where: { id },
          ...sequelizeOptions
        };
        // Note the action is set to Actions.UPDATE above...
        this.setAuthorizeContext(findOptions, optionsClone ?? {});

        modelInstance = await this.model.findOne(findOptions);

        if (!modelInstance) {
          throw new Error(`Invalid ${this.relayClass.name}: No id`);
        }
        isAuthorized = true; // we know this because it would not be returned unless it was
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
    delete (updateInput as any).id;
    // do a second check if needed (ie the check on the input object failed)
    // NOTE: if an authorization is via an associated object, this is not checked, and
    // a specialized version of this method should be implemented
    if (
      isAuthorized ||
      this.can({
        action: Actions.UPDATE,
        authorizable: modelInstance as any,
        options
      })
    ) {
      await modelInstance.update(updateInput as any, sequelizeOptions);
      if (target) {
        await reloadNodeFromModel(target, false);
        return target;
      } else {
        return this.gqlFromDbModel(modelInstance as any);
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
    const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
    if (modelKey in source) {
      sourceModel = Reflect.get(source, modelKey);
      const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
      let findOptions: FindOptions = {
        where: whereClause
      };

      assocService.setAuthorizeContext(findOptions, options ?? {});
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
      edge.node = assocService.gqlFromDbModel(instance) as TAssocApi;
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
  ): Promise<TAssocApi | undefined> {
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
    const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
    const sourceModel = Reflect.get(source, modelKey) as Model<Model<any>>;
    const sequelizeOptions: FindOptions =
      this.convertServiceOptionsToSequelizeOptions(options) ?? {};

    assocService.setAuthorizeContext(sequelizeOptions, options ?? {});

    const associatedModel = (await sourceModel.$get(assoc_key as any, sequelizeOptions)) as Model<
      Model<any>
    >;
    if (associatedModel) {
      Reflect.set(source, assoc_key, assocService.gqlFromDbModel(associatedModel));
      return Reflect.get(source, assoc_key);
    }
    return undefined;
  }

  private makeEdge(cursor: string, node: TApi): TEdge {
    const edge = new this.edgeClass();
    edge.cursor = cursor;
    edge.node = node;
    return edge;
  }
}
