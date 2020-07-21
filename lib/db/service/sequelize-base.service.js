"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SequelizeBaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeBaseService = exports.getSequelizeServiceInterfaceFor = void 0;
const typedi_1 = require("typedi");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const acl_1 = require("@rumbleship/acl");
const oid_1 = require("@rumbleship/oid");
const o11y_1 = require("@rumbleship/o11y");
const iterable_model_sequelize_1 = require("@rumbleship/iterable-model-sequelize");
const gql_1 = require("../../gql");
const helpers_1 = require("../../helpers");
const app_1 = require("../../app/");
const transformers_1 = require("../transformers");
const helpers_2 = require("../helpers");
function getSequelizeServiceInterfaceFor(service) {
    return service;
}
exports.getSequelizeServiceInterfaceFor = getSequelizeServiceInterfaceFor;
let SequelizeBaseService = SequelizeBaseService_1 = class SequelizeBaseService {
    constructor(relayClass, edgeClass, connectionClass, model, ctx, options) {
        this.relayClass = relayClass;
        this.edgeClass = edgeClass;
        this.connectionClass = connectionClass;
        this.model = model;
        this.ctx = ctx;
        this.options = options;
        this.permissions = options.permissions;
        // Force authorizations on retrieve from db
        SequelizeBaseService_1.addAuthCheckHook(model);
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
    can(params) {
        var _a, _b, _c;
        const can = ((_a = params === null || params === void 0 ? void 0 : params.options) === null || _a === void 0 ? void 0 : _a.transaction) || ((_b = params === null || params === void 0 ? void 0 : params.options) === null || _b === void 0 ? void 0 : _b.skipAuthorizationCheck) ||
            this.ctx.authorizer.can(params.action, params.authorizable, this.permissions, (_c = params.treatAsAuthorizerMap) !== null && _c !== void 0 ? _c : acl_1.getAuthorizerTreatAs(params.authorizable, false));
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
    addAuthorizationFilters(findOptions, nodeServiceOptions, authorizableClass, forCountQuery = false) {
        let authorizeContext = transformers_1.getAuthorizeContext(findOptions);
        if (!authorizeContext) {
            authorizeContext = {};
            transformers_1.setAuthorizeContext(findOptions, authorizeContext);
        }
        if (authorizeContext.authApplied || (nodeServiceOptions === null || nodeServiceOptions === void 0 ? void 0 : nodeServiceOptions.skipAuthorizationCheck) ||
            this.getContext().authorizer.inScope(acl_1.Scopes.SYSADMIN)) {
            return findOptions;
        }
        const authorizableClasses = authorizableClass
            ? [authorizableClass]
            : this.options.apiClassFactory
                ? this.options.apiClassFactory.getClasses()
                : [this.relayClass];
        transformers_1.setAuthorizeContext(findOptions, authorizeContext);
        findOptions = this.addAuthorizationToWhere(authorizableClasses, findOptions, nodeServiceOptions, forCountQuery);
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
    addAuthorizationToWhere(authorizableClasses, findOptions, nodeServiceOptions = {}, forCountQuery = false) {
        var _a, _b;
        if (nodeServiceOptions === null || nodeServiceOptions === void 0 ? void 0 : nodeServiceOptions.skipAuthorizationCheck) {
            return findOptions;
        }
        // because they are classes not instances...
        const protypesForClasses = authorizableClasses.map(clazz => clazz.prototype);
        let whereAuthClause = {};
        for (const authProtos of protypesForClasses) {
            whereAuthClause = {
                ...whereAuthClause,
                ...transformers_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, (_a = nodeServiceOptions === null || nodeServiceOptions === void 0 ? void 0 : nodeServiceOptions.action) !== null && _a !== void 0 ? _a : acl_1.Actions.QUERY, authProtos)
            };
            // any associated objects that must be scanned?
            const authThroughEntries = protypesForClasses
                .map(proto => transformers_1.getAuthorizeThroughEntries(proto))
                .reduce((pre, val) => pre.concat(val));
            const eagerLoads = [];
            let includedWhereAuthClause = {};
            for (const authEntry of authThroughEntries) {
                includedWhereAuthClause = {
                    ...includedWhereAuthClause,
                    ...transformers_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, (_b = nodeServiceOptions === null || nodeServiceOptions === void 0 ? void 0 : nodeServiceOptions.action) !== null && _b !== void 0 ? _b : acl_1.Actions.QUERY, authEntry.targetClass().prototype, authEntry.associationName)
                };
                // We must also eager load the association to ensure that it is in scope of the where
                const assocModel = this.getServiceFor(authEntry.targetClass()).dbModel();
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
                ...{ [sequelize_1.Op.or]: [includedWhereAuthClause, whereAuthClause] }
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
    static addAuthCheckHook(modelClass) {
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
            if (!SequelizeBaseService_1.hooksMap.has(modelClass)) {
                SequelizeBaseService_1.hooksMap.add(modelClass);
                modelClass.addHook('beforeFind', (findOptions) => {
                    const authorizeContext = transformers_1.getAuthorizeContext(findOptions);
                    if (!authorizeContext) {
                        // we can get some finds as part of an update (eg Model.add()), in which case
                        // we check to see if the overall transaction has been authorized as the findOptions are
                        // created deep in the sequelize framework
                        const transaction = Reflect.get(findOptions, 'transaction');
                        if (transaction && transformers_1.getAuthorizeContext(transaction)) {
                            return;
                        }
                        if (Reflect.get(findOptions, 'reloadAuthSkip')) {
                            return;
                        }
                        throw new Error(`SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an AuthorizeContext added to the findOptions 
                (${modelClass.name}})`);
                    }
                });
            }
        }
    }
    async addAuthorizationFiltersAndWrapWithTransaction(options, theFunctionToWrap) {
        const { opts, authorizableClass } = options;
        let transactionCreated = false;
        if (!opts.transaction) {
            opts.transaction = await this.newTransaction({
                isolation: gql_1.NodeServiceIsolationLevel.READ_COMMITTED,
                autocommit: false
            });
            opts.lockLevel = gql_1.NodeServiceLock.SHARE;
            transactionCreated = true;
        }
        transformers_1.setAuthorizeContext(opts.transaction, {});
        const sequelizeOptions = this.addAuthorizationFilters({
            ...this.convertServiceOptionsToSequelizeOptions(opts)
        }, opts, authorizableClass);
        try {
            return await theFunctionToWrap(sequelizeOptions);
        }
        catch (e) {
            this.ctx.logger.error(e.stack);
            if (transactionCreated && opts.transaction) {
                await this.endTransaction(opts.transaction, 'rollback');
                opts.transaction = undefined;
            }
            throw e;
        }
        finally {
            if (transactionCreated && opts.transaction) {
                await this.endTransaction(opts.transaction, 'commit');
            }
        }
    }
    setServiceRegister(services) {
        this.nodeServices = services;
    }
    nodeType() {
        return this.relayClass.constructor.name;
    }
    /**
     * Creates the appropriate gql Relay object from the sequelize
     * Model instance. Note that eager loaded associated Models are NOT converted.
     * @param dbModel
     */
    gqlFromDbModel(dbModel) {
        const gqlObject = this.options.apiClassFactory
            ? this.options.apiClassFactory.makeFrom(dbModel, this)
            : transformers_1.dbToGql(this, this.relayClass, dbModel);
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
    dbModel() {
        return this.model;
    }
    getContext() {
        return this.ctx;
    }
    addTraceContext(filterBy) {
        const { after, before, first, last, ...filter } = filterBy;
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
    getServiceFor(cls) {
        const name = typeof cls === 'string' ? cls : cls.name;
        if (name in this.nodeServices) {
            return Reflect.get(this.nodeServices, name);
        }
        throw Error(`Service not defined for Class: ${name}`);
    }
    getServiceForDbModel(dbClass) {
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
    async newTransaction(params) {
        const txn = await this.model.sequelize.transaction({
            isolationLevel: params.isolation,
            autocommit: params.autocommit,
            type: params.type
        });
        this.ctx.beeline.addTraceContext({
            'db.transaction.isolationLevel': params.isolation,
            'db.transaction.autocommit': params.autocommit,
            'db.transaction.type': params.type,
            'db.transaction.id': txn.id
        });
        app_1.setContextId(txn, this.ctx.id);
        app_1.setAuthorizedUser(txn, this.ctx.authorizer);
        this.ctx.logger.addMetadata({
            txn: { id: txn.id, options: txn.options }
        });
        this.ctx.logger.info('transaction_started');
        return txn;
    }
    async endTransaction(transaction, action) {
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
    convertServiceOptionsToSequelizeOptions(options) {
        if (options) {
            const transaction = options
                ? options.transaction
                : undefined;
            let lock;
            if (transaction) {
                lock = options.lockLevel
                    ? options.lockLevel === gql_1.NodeServiceLock.UPDATE
                        ? sequelize_1.Transaction.LOCK.UPDATE
                        : sequelize_1.Transaction.LOCK.SHARE
                    : undefined;
            }
            return { paranoid: options.paranoid, transaction, lock };
        }
        else {
            return undefined;
        }
    }
    async getAll(filterBy, options) {
        var _a;
        filterBy = gql_1.cloneAndTransposeDeprecatedValues(filterBy);
        this.addTraceContext(filterBy);
        const { after, before, first, last, order_by, ...filter } = filterBy;
        const orderClause = transformers_1.createOrderClause(order_by);
        // const filters = [];
        // we hold cursors as base64 of the offset for this query... not perfect,
        // but good enough for now
        // see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
        // However... we only support before OR after.
        //
        const connection = new this.connectionClass();
        const limits = helpers_2.calculateLimitAndOffset(after, first, before, last);
        const whereClause = transformers_1.createWhereClauseWith(filter);
        const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options)) !== null && _a !== void 0 ? _a : {};
        const findOptions = {
            where: whereClause,
            offset: limits.offset,
            limit: limits.limit,
            order: orderClause,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, options !== null && options !== void 0 ? options : {});
        const { rows, count } = await this.model.findAndCountAll(findOptions);
        // prime the cache
        // this.sequelizeDataloaderCtx.prime(rows);
        const { pageBefore, pageAfter } = helpers_2.calculateBeforeAndAfter(limits.offset, limits.limit, count);
        const edges = rows.map(instance => this.makeEdge(helpers_1.toBase64(limits.offset++), this.gqlFromDbModel(instance)));
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async findOne(filterBy, options) {
        filterBy = gql_1.cloneAndTransposeDeprecatedValues(filterBy);
        this.addTraceContext(filterBy);
        // Authorization done in getAll
        const matched = await this.getAll({ ...filterBy, ...{ first: 1 } }, options);
        if (matched.edges.length) {
            return matched.edges[0].node;
        }
        return undefined;
    }
    async findEach(filterBy, apply, options) {
        this.addTraceContext(filterBy);
        filterBy = gql_1.cloneAndTransposeDeprecatedValues(filterBy);
        // const filters = [];
        const { after, before, first, last, ...filter } = filterBy;
        const whereClause = transformers_1.createWhereClauseWith(filter);
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const findOptions = {
            where: whereClause,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, options !== null && options !== void 0 ? options : {});
        for await (const instance of iterable_model_sequelize_1.modelIterator(this.model, findOptions)) {
            const apiModel = this.gqlFromDbModel(instance);
            await apply(apiModel, options);
        }
    }
    async count(filterBy, options) {
        this.addTraceContext(filterBy);
        // const filters = [];
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        filterBy = transformers_1.createWhereClauseWith(filterBy);
        const findOptions = {
            where: filterBy,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, options !== null && options !== void 0 ? options : {});
        return this.model.count(findOptions);
    }
    async getOne(oid, options) {
        this.ctx.beeline.addTraceContext({ 'relay.node.id': oid.toString() });
        const { id } = oid.unwrap();
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const findOptions = {
            where: { id },
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, options !== null && options !== void 0 ? options : {});
        const instance = await this.model.findOne(findOptions);
        if (!instance) {
            throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
        }
        return this.gqlFromDbModel(instance);
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
    async create(createInput, options) {
        if (this.can({
            action: acl_1.Actions.CREATE,
            authorizable: createInput,
            options
        })) {
            createInput = gql_1.cloneAndTransposeDeprecatedValues(createInput);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const instance = await this.model.create(createInput, sequelizeOptions);
            const node = this.gqlFromDbModel(instance);
            this.ctx.beeline.addTraceContext({ 'relay.node.id': node.id.toString() });
            return node;
        }
        this.ctx.logger.info('sequelize_base_service_authorization_denied');
        throw new acl_1.RFIAuthError();
    }
    /**
     * Runs an autyhroization query to see if the requested action  is allowed based
     * on the users permissions
     * @param oid
     * @param action
     * @param options
     */
    async checkDbIsAuthorized(id, action, sequelizeOptions, options) {
        if (options === null || options === void 0 ? void 0 : options.skipAuthorizationCheck) {
            return true;
        }
        const optionsForTest = { ...options, action };
        const findOptions = {
            where: { id },
            attributes: ['id'],
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, optionsForTest);
        const instance = await this.model.findOne(findOptions);
        if (!instance) {
            return false;
        }
        else {
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
    async update(updateInput, options, target) {
        if (target && !(transformers_1.modelKey in target)) {
            throw new Error(`Invalid target for ${this.relayClass.name}`);
        }
        updateInput = gql_1.cloneAndTransposeDeprecatedValues(updateInput);
        let isAuthorized = (options === null || options === void 0 ? void 0 : options.skipAuthorizationCheck) ? true : false;
        const oid = target
            ? target.id
            : updateInput.id
                ? new oid_1.Oid(updateInput.id.toString())
                : undefined;
        if (!oid) {
            throw new Error(`Invalid ${this.relayClass.name}: No id`);
        }
        this.ctx.beeline.addTraceContext({ 'relay.node.id': oid.toString() });
        delete updateInput.id;
        const { id: dbId } = oid.unwrap();
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        isAuthorized = isAuthorized
            ? isAuthorized
            : await this.checkDbIsAuthorized(dbId, acl_1.Actions.UPDATE, sequelizeOptions !== null && sequelizeOptions !== void 0 ? sequelizeOptions : {}, options);
        if (!isAuthorized) {
            throw new acl_1.RFIAuthError();
        }
        // start a (nested) transaction
        const updateTransaction = await this.model.sequelize.transaction({
            transaction: sequelizeOptions === null || sequelizeOptions === void 0 ? void 0 : sequelizeOptions.transaction,
            autocommit: false
        });
        try {
            // we are definately authed to go find the model,
            //  set the context so we can do sequelize finds
            // within the rest of this function
            const findOptions = transformers_1.setAuthorizeContext({ ...sequelizeOptions, transaction: updateTransaction }, { authApplied: true });
            const modelInstance = target
                ? Reflect.get(target, transformers_1.modelKey)
                : await this.model.findByPk(dbId, findOptions);
            if (!modelInstance) {
                throw new Error('invalid model in db');
            }
            await modelInstance.update(gql_1.cloneAndTransposeDeprecatedValues(updateInput), {
                ...sequelizeOptions,
                transaction: updateTransaction
            });
            isAuthorized = await this.checkDbIsAuthorized(dbId, acl_1.Actions.UPDATE, { ...sequelizeOptions, transaction: updateTransaction }, options);
            if (!isAuthorized) {
                throw new acl_1.RFIAuthError();
            }
            else {
                await updateTransaction.commit();
            }
            if (target) {
                await transformers_1.reloadNodeFromModel(target, false);
                return target;
            }
            else {
                return this.gqlFromDbModel(modelInstance);
            }
        }
        catch (e) {
            await updateTransaction.rollback();
            throw e;
        }
    }
    async getAssociatedMany(source, assoc_key, filterBy, assocApiClass, assocEdgeClass, assocConnectionClass, options) {
        this.addTraceContext(filterBy);
        this.ctx.beeline.addTraceContext({
            'db.service.association.source': source.id.toString(),
            'db.service.association.target': assoc_key
        });
        const { after, before, first, last, order_by, ...filter } = filterBy;
        const orderClause = transformers_1.createOrderClause(order_by);
        const limits = helpers_2.calculateLimitAndOffset(after, first, before, last);
        const whereClause = transformers_1.createWhereClauseWith(filter);
        let sourceModel;
        let count = 0;
        let associated;
        const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
        if (transformers_1.modelKey in source) {
            sourceModel = Reflect.get(source, transformers_1.modelKey);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            let findOptions = {
                where: whereClause,
                order: orderClause
            };
            const countOptions = {
                where: whereClause,
                attributes: [],
                order: orderClause
            };
            assocService.addAuthorizationFilters(countOptions, options !== null && options !== void 0 ? options : {}, undefined, true);
            count = await sourceModel.$count(assoc_key, countOptions);
            assocService.addAuthorizationFilters(findOptions, options !== null && options !== void 0 ? options : {});
            findOptions = {
                ...findOptions,
                offset: limits.offset,
                limit: limits.limit,
                order: orderClause,
                ...sequelizeOptions
            };
            const result = await sourceModel.$get(assoc_key, findOptions);
            Array.isArray(result) ? (associated = result) : (associated = [result]);
        }
        else {
            throw new Error(`Invalid ${source.constructor.name}`);
        }
        const { pageBefore, pageAfter } = helpers_2.calculateBeforeAndAfter(limits.offset, limits.limit, count);
        // TODO TODO TODO - need to put this in the associated service... and know what
        // type its creating
        //
        let edges;
        edges = associated.map(instance => {
            const edge = new assocEdgeClass();
            edge.cursor = helpers_1.toBase64(limits.offset++);
            edge.node = assocService.gqlFromDbModel(instance);
            return edge;
        });
        const connection = new assocConnectionClass();
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async getAssociated(source, assoc_key, assocApiClass, options) {
        var _a;
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
        if (!(transformers_1.modelKey in source)) {
            throw new Error(`Invalid ${source.constructor.name}`);
        }
        const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
        /*
         * With eager loading, the model may already be in place but of the wrong type :-)
         * If it isnt a relay class, and it isnt a sequelize model then reload
         */
        if (!(associatedModel instanceof sequelize_typescript_1.Model)) {
            const sourceModel = Reflect.get(source, transformers_1.modelKey);
            const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options)) !== null && _a !== void 0 ? _a : {};
            assocService.addAuthorizationFilters(sequelizeOptions, options !== null && options !== void 0 ? options : {});
            associatedModel = (await sourceModel.$get(assoc_key, sequelizeOptions));
        }
        if (associatedModel) {
            Reflect.set(source, assoc_key, assocService.gqlFromDbModel(associatedModel));
            return Reflect.get(source, assoc_key);
        }
        return undefined;
    }
    makeEdge(cursor, node) {
        const edge = new this.edgeClass();
        edge.cursor = cursor;
        edge.node = node;
        return edge;
    }
};
SequelizeBaseService.hooksMap = new Set();
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "newTransaction", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "endTransaction", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "getAll", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "findOne", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "findEach", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "count", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oid_1.Oid, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "getOne", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "create", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "checkDbIsAuthorized", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "update", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "getAssociatedMany", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SequelizeBaseService.prototype, "getAssociated", null);
SequelizeBaseService = SequelizeBaseService_1 = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [Object, Object, Object, Object, app_1.RumbleshipContext, Object])
], SequelizeBaseService);
exports.SequelizeBaseService = SequelizeBaseService;
//# sourceMappingURL=sequelize-base.service.js.map