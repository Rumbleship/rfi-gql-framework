import { Service } from 'typedi';
import { Transaction, FindOptions, Op, LOCK } from 'sequelize';
import { Model, AssociationCountOptions } from 'sequelize-typescript';
import {
  Actions,
  RFIAuthError,
  Permissions,
  AuthorizerTreatAsMap,
  Scopes,
  getAuthorizerTreatAs
} from '@rumbleship/acl';
import { Oid } from '@rumbleship/oid';
import { AddToTrace } from '@rumbleship/o11y';
import { modelIterator } from '@rumbleship/iterable-model-sequelize';
import {
  Connection,
  Edge,
  Node,
  NodeService,
  NodeServiceOptions,
  NodeServiceLock,
  NodeServiceTransaction,
  NodeServiceIsolationLevel,
  NodeServiceTransactionType,
  RelayFilterBase,
  cloneAndTransposeDeprecatedValues
} from '../../gql';
import { toBase64, ClassType } from '../../helpers';
import { RumbleshipContext, setContextId, setAuthorizedUser } from '../../app/rumbleship-context';
import {
  GqlSingleTableInheritanceFactory,
  getAuthorizeContext,
  AuthorizeContext,
  setAuthorizeContext,
  createAuthWhereClause,
  getAuthorizeThroughEntries,
  dbToGql,
  createWhereClauseWith,
  modelKey,
  reloadNodeFromModel,
  AuthIncludeEntry,
  createOrderClause,
  gqlToDb
} from '../transformers';
import { ModelClass, SequelizeBaseServiceInterface } from './sequelize-base-service.interface';
import { calculateLimitAndOffset, calculateBeforeAndAfter } from '../helpers';
import { NotFoundError } from '../../app/errors';
import { NodeServiceMap } from '../../app/server/add-node-services-to-container';

export function getSequelizeServiceInterfaceFor<
  TApi extends Node<TApi>,
  TModel extends Model<TModel>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate,
  V extends NodeService<TApi>
>(service: V): SequelizeBaseServiceInterface {
  return (service as unknown) as SequelizeBaseServiceInterface;
}

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
  constructor(
    protected relayClass: ClassType<TApi>,
    protected edgeClass: ClassType<TEdge>,
    protected connectionClass: ClassType<TConnection>,
    protected model: ModelClass<TModel> & typeof Model,
    protected ctx: RumbleshipContext,
    protected options: {
      permissions: Permissions;
      apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    }
  ) {
    this.permissions = options.permissions;
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
    authorizable: Record<string, any>;
    options?: NodeServiceOptions;
    treatAsAuthorizerMap?: AuthorizerTreatAsMap;
  }): boolean {
    const can =
      params?.options?.transaction ||
      params?.options?.skipAuthorizationCheck ||
      this.ctx.authorizer.can(
        params.action,
        params.authorizable,
        this.permissions,
        params.treatAsAuthorizerMap ?? getAuthorizerTreatAs(params.authorizable, false)
      );
    return can ? true : false;
  }

  /**
   * Connects the options passed into the API to the sequelize options used in a query and the
   * service that is being used.
   *
   * @param findOptions Typically the FindOptions sequelize object passed into a query
   * @param nodeServiceOptions The framework options passed into the API
   * @param authorizableClass The decorated class to use to determine what attributes are to used as filters
   */
  addAuthorizationFilters(
    findOptions: FindOptions,
    nodeServiceOptions: NodeServiceOptions,
    authorizableClass?: ClassType<Record<string, any>>,
    forCountQuery = false
  ): FindOptions {
    let authorizeContext: AuthorizeContext = getAuthorizeContext(findOptions);
    if (!authorizeContext) {
      authorizeContext = {};
      setAuthorizeContext(findOptions, authorizeContext);
    }
    if (
      authorizeContext.authApplied ||
      nodeServiceOptions?.skipAuthorizationCheck ||
      this.getContext().authorizer.inScope(Scopes.SYSADMIN)
    ) {
      return findOptions;
    }
    const authorizableClasses = authorizableClass
      ? [authorizableClass]
      : this.options.apiClassFactory
      ? this.options.apiClassFactory.getClasses()
      : [this.relayClass];
    setAuthorizeContext(findOptions, authorizeContext);
    findOptions = this.addAuthorizationToWhere(
      authorizableClasses,
      findOptions,
      nodeServiceOptions,
      forCountQuery
    );
    authorizeContext.authApplied = true;

    return findOptions;
  }
  /**
   *
   * Called by the setAuthorizeContext. Dont call directly unless you have totally overridden
   * the auth and want to do some special processing...
   *
   * @param findOptions
   * @param nodeServiceOptions
   */
  protected addAuthorizationToWhere(
    authorizableClasses: Array<ClassType<Record<string, any>>>,
    findOptions: FindOptions,
    nodeServiceOptions: NodeServiceOptions = {},
    forCountQuery = false
  ): FindOptions {
    if (nodeServiceOptions?.skipAuthorizationCheck) {
      return findOptions;
    }
    // because they are classes not instances...
    const protypesForClasses = authorizableClasses.map(clazz => clazz.prototype);
    let whereAuthClause: FindOptions = {};
    for (const authProtos of protypesForClasses) {
      whereAuthClause = {
        ...whereAuthClause,
        ...createAuthWhereClause(
          this.permissions,
          this.ctx.authorizer,
          nodeServiceOptions?.action ?? Actions.QUERY,
          authProtos
        )
      };
      // any associated objects that must be scanned?
      const authThroughEntries = protypesForClasses
        .map(proto => getAuthorizeThroughEntries(proto))
        .reduce((pre, val) => pre.concat(val));
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
          as: authEntry.associationName,
          // If we're counting, force the omission of all attributes on eager includes.
          // Otherwise, let Sequelize inflect its defaults and load whatever it wants
          attributes: forCountQuery ? [] : undefined
        });
      }
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
   * This should be called ONLY by the service contructor and adds the authorization check
   * to the sequelize Model Class.
   *
   * @param modelClass
   */
  static addAuthCheckHook(modelClass: typeof Model): void {
    // We keep a set of models that have already had a hook added.
    // Its kind of ugly but seems the best way. Although I'm inclined to have a global
    // hook so ALL finds are checked for auth filters...
    //
    // In the meantime... Watch for closures, this gets added once, so dont add anything but static/globals
    // to the members
    // so all of the context MUST be got form the options object passsed into the find.
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
            // we can get some finds as part of an update (eg Model.add()), in which case
            // we check to see if the overall transaction has been authorized as the findOptions are
            // created deep in the sequelize framework
            const transaction = Reflect.get(findOptions, 'transaction');
            if (transaction && getAuthorizeContext(transaction)) {
              return;
            }
            if (Reflect.get(findOptions, 'reloadAuthSkip')) {
              return;
            }
            throw new Error(
              `SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an AuthorizeContext added to the findOptions 
                (${modelClass.name}})`
            );
          }
        });
      }
    }
  }

  async addAuthorizationFiltersAndWrapWithTransaction<T>(
    options: {
      opts: NodeServiceOptions;
      authorizableClass?: ClassType<Record<string, any>>;
    },
    theFunctionToWrap: (sequelizeOptions: { transaction?: Transaction }) => Promise<T>
  ): Promise<T> {
    const { opts, authorizableClass } = options;
    let transactionCreated = false;
    if (!opts.transaction) {
      opts.transaction = await this.newTransaction({
        isolation: NodeServiceIsolationLevel.READ_COMMITTED,
        autocommit: false
      });
      opts.lockLevel = NodeServiceLock.SHARE;

      transactionCreated = true;
    }
    setAuthorizeContext(opts.transaction, {});
    const sequelizeOptions = this.addAuthorizationFilters(
      {
        ...this.convertServiceOptionsToSequelizeOptions(opts)
      },
      opts,
      authorizableClass
    );
    try {
      return await theFunctionToWrap(sequelizeOptions);
    } catch (e) {
      this.ctx.logger.error(e.stack);
      if (transactionCreated && opts.transaction) {
        await this.endTransaction(opts.transaction, 'rollback');
        opts.transaction = undefined;
      }
      throw e;
    } finally {
      if (transactionCreated && opts.transaction) {
        await this.endTransaction(opts.transaction, 'commit');
      }
    }
  }

  setServiceRegister(services: NodeServiceMap): void {
    this.nodeServices = services;
  }
  nodeType(): string {
    return this.relayClass.constructor.name;
  }
  /**
   * Creates the appropriate gql Relay object from the sequelize
   * Model instance. Note that eager loaded associated Models are NOT converted.
   * @param dbModel
   */
  gqlFromDbModel(dbModel: TModel): TApi {
    const gqlObject = this.options.apiClassFactory
      ? this.options.apiClassFactory.makeFrom(dbModel, this)
      : dbToGql(this, this.relayClass, dbModel);
    // Singular associated objects are also converted to gqlRelayObjects
    // Note that this will only happen in eager loading.
    //
    // However 'Many' associtions are not managed here. As they are complex and require
    // Connection paging logic.
    //
    // for (const key in gqlObject) {
    //   if (gqlObject.hasOwnProperty(key)) {
    //     if (gqlObject[key] instanceof Model) {
    //       const service = this.getServiceForDbModel((gqlObject[key] as unknown) as Model);
    //       gqlObject[key] = service.gqlFromDbModel((gqlObject[key] as unknown) as Model);
    //     }
    //   }
    // }
    return gqlObject;
  }

  /***
   * ONLY to be used from the implmentation of another SequelizeService.
   */
  dbModelFromGql(relayObject: TApi): TModel {
    return gqlToDb(relayObject);
  }

  dbModel(): ModelClass<TModel> & typeof Model {
    return this.model;
  }

  getContext(): RumbleshipContext {
    return this.ctx;
  }

  private addTraceContext(filterBy: RelayFilterBase<any>): void {
    const { after, before, first, last, ...filter } = filterBy as any;
    this.ctx.beeline.addTraceContext({
      'db.service.pagination.after': after,
      'db.service.pagination.before': before,
      'db.service.pagination.first': first,
      'db.service.pagination.last': last
    });
    for (const [k, v] of Object.entries(filter)) {
      this.ctx.beeline.addTraceContext({
        [`db.service.filter.${k}`]: v
      });
    }
  }

  getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V {
    const name = typeof cls === 'string' ? cls : cls.name;
    if (name in this.nodeServices) {
      return Reflect.get(this.nodeServices, name);
    }
    throw Error(`Service not defined for Class: ${name}`);
  }
  getServiceForDbModel(
    dbClass: Model
  ): SequelizeBaseServiceInterface<any, any, any, any, any, any> {
    for (const key in this.nodeServices) {
      if (this.nodeServices.hasOwnProperty(key)) {
        const service = this.nodeServices[key];
        if (service.dbModel === dbClass) {
          return service;
        }
      }
    }
    throw Error(`Service not defined for Model`);
  }

  @AddToTrace()
  async newTransaction(params: {
    parentTransaction?: NodeServiceTransaction;
    isolation: NodeServiceIsolationLevel;
    autocommit: boolean;
    type?: NodeServiceTransactionType;
  }): Promise<NodeServiceTransaction> {
    const txn: Transaction = (await this.model.sequelize?.transaction({
      transaction: params.parentTransaction as any,
      isolationLevel: params.isolation as any,
      autocommit: params.autocommit,
      type: params.type as any
    })) as Transaction;
    this.ctx.beeline.addTraceContext({
      'db.parentTransaction': params.parentTransaction
        ? (params.parentTransaction as any).id
        : 'NONE',
      'db.transaction.isolationLevel': params.isolation,
      'db.transaction.autocommit': params.autocommit,
      'db.transaction.type': params.type,
      'db.transaction.id': (txn as any).id
    });
    setContextId(txn, this.ctx.id);
    setAuthorizedUser(txn, this.ctx.authorizer);
    this.ctx.logger.addMetadata({
      txn: {
        parentTransaction: params.parentTransaction ? (params.parentTransaction as any).id : 'NONE',
        id: (txn as any).id,
        options: (txn as any).options
      }
    });
    this.ctx.logger.info('transaction_started');
    return (txn as unknown) as NodeServiceTransaction;
  }

  @AddToTrace()
  async endTransaction(
    transaction: NodeServiceTransaction,
    action: 'commit' | 'rollback'
  ): Promise<void> {
    this.ctx.beeline.addTraceContext({ 'db.transaction.end': action });
    switch (action) {
      case 'commit':
        this.ctx.logger.info('transaction_commit');
        return transaction.commit();
      case 'rollback':
        this.ctx.logger.info('transaction_rollback');
        return transaction.rollback();
    }
  }

  convertServiceOptionsToSequelizeOptions(
    options?: NodeServiceOptions
  ): { paranoid?: boolean; transaction?: Transaction; lock?: LOCK } {
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
      return {};
    }
  }

  @AddToTrace()
  async getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection> {
    filterBy = cloneAndTransposeDeprecatedValues(filterBy);
    this.addTraceContext(filterBy);
    const { after, before, first, last, order_by, ...filter } = filterBy as RelayFilterBase<TApi>;

    const orderClause = createOrderClause(order_by);
    // const filters = [];
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
      order: orderClause,
      ...sequelizeOptions
    };

    this.addAuthorizationFilters(findOptions, options ?? {});

    // because we may have scopes, we need to do this in two calls instead of findANdCountAll
    // as that reutruns the number of ROWS not objects
    const count = await this.model.unscoped().count(findOptions);
    const rows = await this.model.findAll(findOptions);
    // prime the cache
    // this.sequelizeDataloaderCtx.prime(rows);
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    const edges: Array<Edge<TApi>> = rows.map(instance =>
      this.makeEdge(toBase64(limits.offset++), this.gqlFromDbModel(instance as any))
    );

    connection.addEdges(edges, pageAfter, pageBefore);

    return connection;
  }

  @AddToTrace()
  async findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | undefined> {
    filterBy = cloneAndTransposeDeprecatedValues(filterBy);
    this.addTraceContext(filterBy);
    // Authorization done in getAll
    const matched = await this.getAll({ ...filterBy, ...{ first: 1 } }, options);
    if (matched.edges.length) {
      return matched.edges[0].node;
    }

    return undefined;
  }

  @AddToTrace()
  async findEach(
    filterBy: TFilter,
    apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>,
    options?: NodeServiceOptions
  ): Promise<void> {
    this.addTraceContext(filterBy);
    filterBy = cloneAndTransposeDeprecatedValues(filterBy);
    // const filters = [];
    const { after, before, first, last, ...filter } = filterBy as any;

    const whereClause = createWhereClauseWith(filter);
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: whereClause,
      ...sequelizeOptions
    };
    this.addAuthorizationFilters(findOptions, options ?? {});
    for await (const instance of modelIterator(this.model, findOptions)) {
      const apiModel = this.gqlFromDbModel(instance as any);
      await apply(apiModel, options);
    }
  }

  @AddToTrace()
  async count(filterBy: TFilter, options?: NodeServiceOptions): Promise<number> {
    this.addTraceContext(filterBy);
    // const filters = [];
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: createWhereClauseWith(filterBy),
      ...sequelizeOptions
    };
    this.addAuthorizationFilters(findOptions, options ?? {});
    return this.model.unscoped().count(findOptions);
  }

  @AddToTrace()
  async getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi> {
    this.ctx.beeline.addTraceContext({ 'relay.node.id': oid.toString() });
    const { id } = oid.unwrap();
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    const findOptions: FindOptions = {
      where: { id },
      ...sequelizeOptions
    };
    this.addAuthorizationFilters(findOptions, options ?? {});

    const instance = await this.model.findOne(findOptions);
    if (!instance) {
      throw new NotFoundError(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
    }
    return this.gqlFromDbModel(instance as any);
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
  @AddToTrace()
  async create(createInput: TInput, uncloned_options: NodeServiceOptions = {}): Promise<TApi> {
    const options: NodeServiceOptions = { ...uncloned_options };
    if (
      this.can({
        action: Actions.CREATE,
        authorizable: createInput as any,
        options
      })
    ) {
      createInput = cloneAndTransposeDeprecatedValues(createInput);
      /**
       * All changes (update/create/etc) must be within a transaction, which Sequelize guarantees
       * to pass to low level model hooks that the publisher listens to.
       *
       * We attach data (authorized acting user, marshalled trace, etc) to the transaction object
       * to take advantage of this behavior and allow a the publisher to make the payloads it
       * publishes aware of the `RumbleshipContext` that generated them.
       */
      options.transaction =
        options.transaction ??
        (await this.newTransaction({
          isolation: NodeServiceIsolationLevel.READ_COMMITTED,
          autocommit: false
        }));
      try {
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const instance = await this.model.create(createInput as any, sequelizeOptions);
        const node = this.gqlFromDbModel(instance as any);
        this.ctx.beeline.addTraceContext({ 'relay.node.id': node.id.toString() });
        return node;
      } catch (e) {
        if (!uncloned_options.transaction) {
          await this.endTransaction(options.transaction, 'rollback');
          // Explicitly unset it so the finally doesn't commit
          options.transaction = undefined;
        }
        throw e;
      } finally {
        if (options.transaction && !uncloned_options.transaction) {
          await this.endTransaction(options.transaction, 'commit');
        }
      }
    }
    this.ctx.logger.info('sequelize_base_service_authorization_denied');
    throw new RFIAuthError();
  }
  /**
   * Runs an autyhroization query to see if the requested action  is allowed based
   * on the users permissions
   * @param oid
   * @param action
   * @param options
   */
  @AddToTrace()
  async checkDbIsAuthorized(
    id: string | number,
    action: Actions,
    sequelizeOptions: FindOptions,
    options?: NodeServiceOptions
  ): Promise<boolean> {
    if (options?.skipAuthorizationCheck) {
      return true;
    }
    const optionsForTest: NodeServiceOptions = { ...options, action };
    const findOptions: FindOptions = {
      where: { id },
      attributes: ['id'],
      ...sequelizeOptions
    };
    this.addAuthorizationFilters(findOptions, optionsForTest);
    const instance = await this.model.findOne(findOptions);
    if (!instance) {
      return false;
    } else {
      return true;
    }
  }
  /**
   *
   * Updates with data dependant authorizations require a check on the before data and a
   * check on the after data. For the update to be successful, both checks must suceed.
   *
   * Authorization check for updates:
   *   Check option to skip authorization
   *      else
   *   If not skipped, the update start a (nested) transaction
   *    re-read with Action.UPDATE permission matrix to see if you can update the version in the db.
   *    make the update
   *    re-read again with the permissions for Actions.update.
   *      if the object is not retrievable, it means that the update is not allowed, and the
   *         transaction is rolled back and an exception thrown.
   *
   *
   *
   * @param updateInput - data to uipdate
   * @param options - may include a transaction
   * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
   */
  @AddToTrace()
  async update(
    updateInput: TUpdate,
    uncloned_options: NodeServiceOptions = {},
    target?: TApi
  ): Promise<TApi> {
    const options: NodeServiceOptions = { ...uncloned_options };
    if (target && !(modelKey in target)) {
      throw new Error(`Invalid target for ${this.relayClass.name}`);
    }
    updateInput = cloneAndTransposeDeprecatedValues(updateInput);
    let isAuthorized = options?.skipAuthorizationCheck ? true : false;

    const oid = target
      ? target.id
      : (updateInput as any).id
      ? new Oid((updateInput as any).id.toString())
      : undefined;
    if (!oid) {
      throw new Error(`Invalid ${this.relayClass.name}: No id`);
    }
    this.ctx.beeline.addTraceContext({ 'relay.node.id': oid.toString() });
    delete (updateInput as any).id;
    const { id: dbId } = oid.unwrap();
    /**
     * All changes (update/create/etc) must be within a transaction, which Sequelize guarantees
     * to pass to low level model hooks that the publisher listens to.
     *
     * We attach data (authorized acting user, marshalled trace, etc) to the transaction object
     * to take advantage of this behavior and allow a the publisher to make the payloads it
     * publishes aware of the `RumbleshipContext` that generated them.
     */
    options.transaction =
      options.transaction ??
      (await this.newTransaction({
        isolation: NodeServiceIsolationLevel.READ_COMMITTED,
        autocommit: false
      }));
    const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
    isAuthorized = isAuthorized
      ? isAuthorized
      : await this.checkDbIsAuthorized(dbId, Actions.UPDATE, sequelizeOptions ?? {}, options);
    if (!isAuthorized) {
      throw new RFIAuthError();
    }
    // start a (nested) transaction
    const updateTransaction = await this.newTransaction({
      parentTransaction: sequelizeOptions.transaction,
      isolation: NodeServiceIsolationLevel.READ_COMMITTED,
      autocommit: false
    });
    try {
      // we are definately authed to go find the model,
      //  set the context so we can do sequelize finds
      // within the rest of this function
      const findOptions = setAuthorizeContext(
        { ...sequelizeOptions, transaction: updateTransaction },
        { authApplied: true }
      );

      const modelInstance = target
        ? (Reflect.get(target, modelKey) as Model)
        : await this.model.findByPk(dbId, findOptions);

      if (!modelInstance) {
        throw new Error('invalid model in db');
      }
      await modelInstance.update(cloneAndTransposeDeprecatedValues(updateInput) as any, {
        ...sequelizeOptions,
        transaction: updateTransaction
      });
      isAuthorized = await this.checkDbIsAuthorized(
        dbId,
        Actions.UPDATE,
        { ...sequelizeOptions, transaction: updateTransaction as any },
        options
      );
      if (!isAuthorized) {
        throw new RFIAuthError();
      } else {
        await updateTransaction.commit();
      }
      if (target) {
        await reloadNodeFromModel(target, false);
        return target;
      } else {
        return this.gqlFromDbModel(modelInstance as any);
      }
    } catch (e) {
      await updateTransaction.rollback();
      if (!uncloned_options.transaction) {
        await this.endTransaction(options.transaction, 'rollback');
        // Explicitly unset it so the finally doesn't commit
        options.transaction = undefined;
      }
      throw e;
    } finally {
      if (options.transaction && !uncloned_options.transaction) {
        await this.endTransaction(options.transaction, 'commit');
      }
    }
  }

  @AddToTrace()
  async getAssociatedMany<
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
  ): Promise<TAssocConnection> {
    this.addTraceContext(filterBy);
    this.ctx.beeline.addTraceContext({
      'db.service.association.source': source.id.toString(),
      'db.service.association.target': assoc_key
    });
    const { after, before, first, last, order_by, ...filter } = filterBy;
    const orderClause = createOrderClause(order_by);

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
        where: whereClause,
        order: orderClause
      };

      const countOptions: AssociationCountOptions = {
        scope: false,
        where: whereClause,
        attributes: [],
        order: orderClause
      };

      assocService.addAuthorizationFilters(countOptions, options ?? {}, undefined, true);
      count = await sourceModel.$count(assoc_key, countOptions);
      assocService.addAuthorizationFilters(findOptions, options ?? {});
      findOptions = {
        ...findOptions,
        offset: limits.offset,
        limit: limits.limit,
        order: orderClause,
        ...sequelizeOptions
      };
      const result = await sourceModel.$get(assoc_key as any, findOptions);
      Array.isArray(result) ? (associated = result) : (associated = [result]);
    } else {
      throw new Error(`Invalid ${source.constructor.name}`);
    }
    const { pageBefore, pageAfter } = calculateBeforeAndAfter(limits.offset, limits.limit, count);
    // TODO TODO TODO - need to put this in the associated service... and know what
    // type its creating
    //
    const edges = associated.map(instance => {
      const edge = new assocEdgeClass();
      edge.cursor = toBase64(limits.offset++);
      edge.node = assocService.gqlFromDbModel(instance) as TAssocApi;
      return edge;
    });
    const connection = new assocConnectionClass();
    connection.addEdges(edges, pageAfter, pageBefore);
    return connection;
  }

  @AddToTrace()
  async getAssociated<TAssocApi extends Node<TAssocApi>>(
    source: TApi,
    assoc_key: string,
    assocApiClass: ClassType<TAssocApi>,
    options?: NodeServiceOptions
  ): Promise<TAssocApi | undefined> {
    this.ctx.beeline.addTraceContext({
      [`db.service.association.source`]: source.constructor.name,
      [`db.service.association.target`]: assoc_key
    });
    let associatedModel;
    if (assoc_key in source) {
      associatedModel = Reflect.get(source, assoc_key);
      if (associatedModel instanceof assocApiClass) {
        return associatedModel;
      }
    }
    if (!(modelKey in source)) {
      throw new Error(`Invalid ${source.constructor.name}`);
    }
    const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
    /*
     * With eager loading, the model may already be in place but of the wrong type :-)
     * If it isnt a relay class, and it isnt a sequelize model then reload
     */
    if (!(associatedModel instanceof Model)) {
      const sourceModel = Reflect.get(source, modelKey) as Model<Model<any>>;
      const sequelizeOptions: FindOptions =
        this.convertServiceOptionsToSequelizeOptions(options) ?? {};

      assocService.addAuthorizationFilters(sequelizeOptions, options ?? {});

      associatedModel = (await sourceModel.$get(assoc_key as any, sequelizeOptions)) as Model;
    }
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
