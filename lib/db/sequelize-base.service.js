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
const typedi_1 = require("typedi");
const oid_1 = require("@rumbleship/oid");
const gql_1 = require("../gql");
const index_1 = require("./index");
const sequelize_typescript_1 = require("sequelize-typescript");
const base64_1 = require("../helpers/base64");
const db_to_gql_1 = require("./db-to-gql");
const gql_pubsub_sequelize_engine_1 = require("./gql-pubsub-sequelize-engine");
const sequelize_1 = require("sequelize");
const iterable_model_1 = require("iterable-model");
const acl_1 = require("@rumbleship/acl");
const create_where_clause_with_1 = require("../gql/create-where-clause-with");
const create_auth_where_clause_1 = require("./create-auth-where-clause");
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
        this.spyglassKey = relayClass.constructor.name;
        this.permissions = options.permissions;
        this.ctx.logger.addMetadata({
            [this.spyglassKey]: {
                permissions: this.permissions
            }
        });
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
        var _a, _b, _c, _d;
        const can = ((_b = (_a = params) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.transaction) || ((_d = (_c = params) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.skipAuthorizationCheck) ||
            this.ctx.authorizer.can(params.action, params.authorizable, this.permissions, params.treatAsAuthorizerMap);
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
    addAuthorizationFilters(findOptions, nodeServiceOptions, authorizableClass) {
        var _a;
        let authorizeContext = create_auth_where_clause_1.getAuthorizeContext(findOptions);
        if (!authorizeContext) {
            authorizeContext = {};
            create_auth_where_clause_1.setAuthorizeContext(findOptions, authorizeContext);
        }
        if (authorizeContext.authApplied || ((_a = nodeServiceOptions) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck) ||
            this.getContext().authorizer.inScope(acl_1.Scopes.SYSADMIN)) {
            return findOptions;
        }
        const authorizableClasses = authorizableClass
            ? [authorizableClass]
            : this.options.apiClassFactory
                ? this.options.apiClassFactory.getClasses()
                : [this.relayClass];
        create_auth_where_clause_1.setAuthorizeContext(findOptions, authorizeContext);
        findOptions = this.addAuthorizationToWhere(authorizableClasses, findOptions, nodeServiceOptions);
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
    addAuthorizationToWhere(authorizableClasses, findOptions, nodeServiceOptions) {
        var _a, _b, _c, _d, _e;
        if ((_a = nodeServiceOptions) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck) {
            return findOptions;
        }
        // because they are classes not instances...
        const protypesForClasses = authorizableClasses.map(clazz => clazz.prototype);
        let whereAuthClause = {};
        for (const authProtos of protypesForClasses) {
            whereAuthClause = {
                ...whereAuthClause,
                ...create_auth_where_clause_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, (_c = (_b = nodeServiceOptions) === null || _b === void 0 ? void 0 : _b.action, (_c !== null && _c !== void 0 ? _c : acl_1.Actions.QUERY)), authProtos)
            };
            // any associated objects that must be scanned?
            const authThroughEntries = protypesForClasses
                .map(proto => create_auth_where_clause_1.getAuthorizeThroughEntries(proto))
                .reduce((pre, val) => pre.concat(val));
            const eagerLoads = [];
            let includedWhereAuthClause = {};
            for (const authEntry of authThroughEntries) {
                includedWhereAuthClause = {
                    ...includedWhereAuthClause,
                    ...create_auth_where_clause_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, (_e = (_d = nodeServiceOptions) === null || _d === void 0 ? void 0 : _d.action, (_e !== null && _e !== void 0 ? _e : acl_1.Actions.QUERY)), authEntry.targetClass().prototype, authEntry.associationName)
                };
                // We must also eager load the association to ensure that it is in scope of the where
                const assocModel = this.getServiceFor(authEntry.targetClass()).dbModel();
                eagerLoads.push({
                    model: assocModel,
                    as: authEntry.associationName
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
                    const authorizeContext = create_auth_where_clause_1.getAuthorizeContext(findOptions);
                    if (!authorizeContext) {
                        throw new Error('SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an authorizeService passed in. See SequelizeBaseService');
                    }
                });
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
            : db_to_gql_1.dbToGql(this, this.relayClass, dbModel);
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
        this.ctx.logger.addMetadata({
            txn: { id: txn.id, options: txn.options }
        });
        this.ctx.logger.info('transaction_started');
        return txn;
    }
    async endTransaction(transaction, action) {
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
        const { after, before, first, last, ...filter } = filterBy;
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
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = create_where_clause_with_1.createWhereClauseWith(filter);
        const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options), (_a !== null && _a !== void 0 ? _a : {}));
        const findOptions = {
            where: whereClause,
            offset: limits.offset,
            limit: limits.limit,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, (options !== null && options !== void 0 ? options : {}));
        const { rows, count } = await this.model.findAndCountAll(findOptions);
        // prime the cache
        // this.sequelizeDataloaderCtx.prime(rows);
        const { pageBefore, pageAfter } = index_1.calculateBeforeAndAfter(limits.offset, limits.limit, count);
        const edges = rows.map(instance => this.makeEdge(base64_1.toBase64(limits.offset++), this.gqlFromDbModel(instance)));
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async findOne(filterBy, options) {
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
    async findEach(filterBy, apply, options) {
        this.ctx.logger.addMetadata({
            [this.spyglassKey]: {
                findEach: { filterBy }
            }
        });
        const { after, before, first, last, ...filter } = filterBy;
        const whereClause = create_where_clause_with_1.createWhereClauseWith(filter);
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const findOptions = {
            where: whereClause,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, (options !== null && options !== void 0 ? options : {}));
        const modelFindEach = iterable_model_1.findEach.bind(this.model);
        return modelFindEach(findOptions, (model) => {
            const apiModel = this.gqlFromDbModel(model);
            return apply(apiModel, options);
        });
    }
    async count(filterBy, options) {
        this.ctx.logger.addMetadata({
            [this.spyglassKey]: {
                count: { filterBy }
            }
        });
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        filterBy = create_where_clause_with_1.createWhereClauseWith(filterBy);
        const findOptions = {
            where: filterBy,
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, (options !== null && options !== void 0 ? options : {}));
        return this.model.count(findOptions);
    }
    async getOne(oid, options) {
        this.ctx.logger.addMetadata({
            [this.spyglassKey]: {
                getOne: { ...oid, id: oid.unwrap().id, scope: oid.unwrap().scope }
            }
        });
        const { id } = oid.unwrap();
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const findOptions = {
            where: { id },
            ...sequelizeOptions
        };
        this.addAuthorizationFilters(findOptions, (options !== null && options !== void 0 ? options : {}));
        const instance = await this.model.findOne(findOptions);
        if (!instance) {
            throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
        }
        return this.gqlFromDbModel(instance);
    }
    async publishLastKnownState(oid) {
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
        const findOptions = {
            where: { id }
        };
        this.addAuthorizationFilters(findOptions, {});
        const instance = await this.model.findOne(findOptions);
        if (!instance) {
            throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
        }
        gql_pubsub_sequelize_engine_1.publishCurrentState(instance);
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
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const instance = await this.model.create(createInput, sequelizeOptions);
            return this.gqlFromDbModel(instance);
        }
        this.ctx.logger.info('sequelize_base_service_authorization_denied', {
            [this.spyglassKey]: {
                method: 'create'
            }
        });
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
        var _a;
        if ((_a = options) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck) {
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
        var _a, _b;
        if (target && !(db_to_gql_1.modelKey in target)) {
            throw new Error(`Invalid target for ${this.relayClass.name}`);
        }
        let isAuthorized = ((_a = options) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck) ? true : false;
        const oid = target
            ? target.id
            : updateInput.id
                ? new oid_1.Oid(updateInput.id.toString())
                : undefined;
        if (!oid) {
            throw new Error(`Invalid ${this.relayClass.name}: No id`);
        }
        delete updateInput.id;
        const { id: dbId } = oid.unwrap();
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        isAuthorized = isAuthorized
            ? isAuthorized
            : await this.checkDbIsAuthorized(dbId, acl_1.Actions.UPDATE, (sequelizeOptions !== null && sequelizeOptions !== void 0 ? sequelizeOptions : {}), options);
        if (!isAuthorized) {
            throw new acl_1.RFIAuthError();
        }
        // start a (nested) transaction
        const updateTransaction = await this.model.sequelize.transaction({
            transaction: (_b = sequelizeOptions) === null || _b === void 0 ? void 0 : _b.transaction,
            autocommit: false
        });
        try {
            const modelInstance = target
                ? Reflect.get(target, db_to_gql_1.modelKey)
                : await this.model.findByPk(dbId, { ...sequelizeOptions, transaction: updateTransaction });
            if (!modelInstance) {
                throw new Error('invalid model in db');
            }
            await modelInstance.update(updateInput, {
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
                await db_to_gql_1.reloadNodeFromModel(target, false);
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
    /* <TAssocApi extends Node,
      TAssocConnection extends Connection<TAssocApi>,
      TAssocEdge extends Edge<TAssocApi>,
      TAssocModel
      > */
    async getAssociatedMany(source, assoc_key, filterBy, assocApiClass, assocEdgeClass, assocConnectionClass, options) {
        const { after, before, first, last, ...filter } = filterBy;
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = create_where_clause_with_1.createWhereClauseWith(filter);
        let sourceModel;
        let count = 0;
        let associated;
        const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
        if (db_to_gql_1.modelKey in source) {
            sourceModel = Reflect.get(source, db_to_gql_1.modelKey);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            let findOptions = {
                where: whereClause
            };
            assocService.addAuthorizationFilters(findOptions, (options !== null && options !== void 0 ? options : {}));
            count = await sourceModel.$count(assoc_key, findOptions);
            findOptions = {
                ...findOptions,
                offset: limits.offset,
                limit: limits.limit,
                ...sequelizeOptions
            };
            const result = await sourceModel.$get(assoc_key, findOptions);
            result instanceof Array ? (associated = result) : (associated = [result]);
        }
        else {
            throw new Error(`Invalid ${source.constructor.name}`);
        }
        const { pageBefore, pageAfter } = index_1.calculateBeforeAndAfter(limits.offset, limits.limit, count);
        // TODO TODO TODO - need to put this in the associated service... and know what
        // type its creating
        //
        let edges;
        edges = associated.map(instance => {
            const edge = new assocEdgeClass();
            edge.cursor = base64_1.toBase64(limits.offset++);
            edge.node = assocService.gqlFromDbModel(instance);
            return edge;
        });
        const connection = new assocConnectionClass();
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async getAssociated(source, assoc_key, assocApiClass, options) {
        var _a;
        let associatedModel;
        if (assoc_key in source) {
            associatedModel = Reflect.get(source, assoc_key);
            if (associatedModel instanceof assocApiClass) {
                return associatedModel;
            }
        }
        if (!(db_to_gql_1.modelKey in source)) {
            throw new Error(`Invalid ${source.constructor.name}`);
        }
        const assocService = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass));
        /*
         * With eager loading, the model may already be in place but of the wrong type :-)
         * If it isnt a relay class, and it isnt a sequelize model then reload
         */
        if (!(associatedModel instanceof sequelize_typescript_1.Model)) {
            const sourceModel = Reflect.get(source, db_to_gql_1.modelKey);
            const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options), (_a !== null && _a !== void 0 ? _a : {}));
            assocService.addAuthorizationFilters(sequelizeOptions, (options !== null && options !== void 0 ? options : {}));
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
SequelizeBaseService = SequelizeBaseService_1 = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], SequelizeBaseService);
exports.SequelizeBaseService = SequelizeBaseService;
//# sourceMappingURL=sequelize-base.service.js.map