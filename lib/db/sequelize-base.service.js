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
const base64_1 = require("../helpers/base64");
const model_to_class_1 = require("./model-to-class");
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
    can(params) {
        return ((params.options && (params.options.transaction || params.options.skipAuthorizationCheck)) ||
            this.ctx.authorizer.can(params.action, params.authorizable, this.permissions, params.treatAsAuthorizerMap));
    }
    setAuthorizeContext(target, nodeServiceOptions) {
        return create_auth_where_clause_1.setAuthorizeContext(target, { nodeServiceOptions, service: this });
    }
    /**
     *
     * Called by the hook. Dont call directly
     *
     * @param findOptions
     * @param nodeServiceOptions
     */
    addAuthorizationToWhere(findOptions, nodeServiceOptions) {
        var _a;
        if (!((_a = nodeServiceOptions) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck)) {
            const whereAuthClause = create_auth_where_clause_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, this.relayClass.prototype);
            // any associated objects that must be scanned?
            const authThroughEntries = create_auth_where_clause_1.getAuthorizeThroughEntries(this.relayClass.prototype);
            const eagerLoads = [];
            let includedWhereAuthClause = {};
            for (const authEntry of authThroughEntries) {
                includedWhereAuthClause = {
                    ...includedWhereAuthClause,
                    ...create_auth_where_clause_1.createAuthWhereClause(this.permissions, this.ctx.authorizer, authEntry.targetClass().prototype, authEntry.associationName)
                };
                // We must also eager load the association to ensure that it is in scope of the where
                const assocModel = this.getServiceFor(authEntry.targetClass()).dbModel();
                eagerLoads.push({
                    model: assocModel,
                    as: authEntry.associationName
                });
            }
            // [sequelize.literal('`TheAlias->RecipeIngredient`.amount'), 'amount']
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
    static addAuthCheckHook(modelClass) {
        // We keep a set of models that have already had a hook added.
        // Its kind of ugly but seems the best way. Although I'm inclined to have a global
        // hook so ALL finds are checked for auth filters...
        //
        // In the meantime... Watch for closures, this gets added once, so dont add anything but static/globals
        // to the members
        // so all of the conext MUST be got form the options object passsed into the find.
        //
        //
        if (!SequelizeBaseService_1.hooksMap.has(modelClass)) {
            SequelizeBaseService_1.hooksMap.add(modelClass);
            modelClass.addHook('beforeFind', (findOptions) => {
                var _a;
                const authorizeContext = create_auth_where_clause_1.getAuthorizeContext(findOptions);
                if (!authorizeContext) {
                    throw new Error('SERIOUS PROGRAMING ERROR. All Sequelize queries MUST have an authorizeService passed in. See SequelizeBaseService');
                }
                if (!((_a = authorizeContext.nodeServiceOptions) === null || _a === void 0 ? void 0 : _a.skipAuthorizationCheck)) {
                    if (!authorizeContext.authApplied) {
                        // only do once
                        if (!authorizeContext.service.getContext().authorizer.inScope(acl_1.Scopes.SYSADMIN)) {
                            // This is ugly... but not sure how best to accomplish with typesafety
                            authorizeContext.service.addAuthorizationToWhere(findOptions, authorizeContext.nodeServiceOptions);
                            authorizeContext.authApplied = true;
                        }
                    }
                }
            });
        }
    }
    setServiceRegister(services) {
        this.nodeServices = services;
    }
    nodeType() {
        return this.relayClass.constructor.name;
    }
    gqlFromDbModel(dbModel) {
        if (this.options.apiClassFactory) {
            return this.options.apiClassFactory.makeFrom(dbModel, this);
        }
        else {
            return model_to_class_1.modelToClass(this, this.relayClass, dbModel);
        }
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
        /*if (
          this.can({
            action: Actions.QUERY,
            authorizable: filter as any,
            options
          })
        ) {*/
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = create_where_clause_with_1.createWhereClauseWith(filter);
        const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options), (_a !== null && _a !== void 0 ? _a : {}));
        const findOptions = {
            where: whereClause,
            offset: limits.offset,
            limit: limits.limit,
            ...sequelizeOptions
        };
        this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
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
        const matched = await this.getAll(filterBy, options);
        if (matched.edges.length) {
            return matched.edges[0].node;
        }
        return null;
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
        this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
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
        const findOptions = {
            where: filterBy,
            ...sequelizeOptions
        };
        this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
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
        this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
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
        this.setAuthorizeContext(findOptions, {});
        const instance = await this.model.findOne(findOptions);
        if (!instance) {
            throw new Error(`${this.relayClass.constructor.name}: oid(${oid}) not found`);
        }
        gql_pubsub_sequelize_engine_1.publishCurrentState(instance);
    }
    // Unsure how or where to add the create|update data in a "safe" way here, generically -- so skipping for now.
    async create(data, options) {
        if (this.can({
            action: acl_1.Actions.CREATE,
            authorizable: data,
            options
        })) {
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const instance = await this.model.create(data, sequelizeOptions);
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
     *
     * @param data - data to uipdate
     * @param options - may include a transaction
     * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
     */
    async update(data, options, target) {
        // TODO sort this one through for permissions
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        let node;
        let oid;
        if (target) {
            // we already have the id and should have the model that was loaded
            // this resolves issues with transactional query for update and stops having to go back and reload
            if (model_to_class_1.modelKey in target) {
                node = Reflect.get(target, model_to_class_1.modelKey);
                const gqlModelName = node.constructor.name.slice(0, node.constructor.name.length - 'Model'.length);
                oid = oid_1.Oid.Create(gqlModelName, node.id);
            }
            else {
                // TODO(@isparling) Instead of waiting to the end to throw, can we throw here?
                throw new Error(`Invalid ${this.relayClass.name}: No id`);
            }
        }
        else {
            if (data.id) {
                oid = new oid_1.Oid(data.id.toString());
                const { id } = oid.unwrap();
                const findOptions = {
                    where: { id },
                    ...sequelizeOptions
                };
                this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
                node = await this.model.findOne(findOptions);
                if (!node) {
                    throw new Error(`Invalid ${this.relayClass.name}: No id`);
                }
            }
            else {
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
        delete data.id;
        // TODO(@isparling) given moving of the throws around, this check should no longer be needed.
        // TODO @mathenshall this needs to be slightly different, as there may be associated authorizables
        //
        if (this.can({
            action: acl_1.Actions.UPDATE,
            authorizable: node,
            options
        })) {
            await node.update(data, sequelizeOptions);
            if (target) {
                await model_to_class_1.reloadNodeFromModel(target, false);
                return target;
            }
            else {
                return this.gqlFromDbModel(node);
            }
        }
        else {
            this.ctx.logger.info('sequelize_base_service_authorization_denied', {
                [this.spyglassKey]: {
                    method: 'update'
                }
            });
            throw new acl_1.RFIAuthError();
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
        if (model_to_class_1.modelKey in source) {
            sourceModel = Reflect.get(source, model_to_class_1.modelKey);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            let findOptions = {
                where: whereClause
            };
            this.setAuthorizeContext(findOptions, (options !== null && options !== void 0 ? options : {}));
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
            edge.node = getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass)).gqlFromDbModel(instance);
            return edge;
        });
        const connection = new assocConnectionClass();
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async getAssociated(source, assoc_key, assocApiClass, options) {
        var _a;
        if (assoc_key in source) {
            const ret = Reflect.get(source, assoc_key);
            if (ret instanceof assocApiClass) {
                return ret;
            }
            else {
                throw new Error(`Invalid associated type for ${assoc_key}`);
            }
        }
        if (!(model_to_class_1.modelKey in source)) {
            throw new Error(`Invalid ${source.constructor.name}`);
        }
        const sourceModel = Reflect.get(source, model_to_class_1.modelKey);
        const sequelizeOptions = (_a = this.convertServiceOptionsToSequelizeOptions(options), (_a !== null && _a !== void 0 ? _a : {}));
        this.setAuthorizeContext(sequelizeOptions, (options !== null && options !== void 0 ? options : {}));
        const associatedModel = (await sourceModel.$get(assoc_key, sequelizeOptions));
        if (associatedModel) {
            Reflect.set(source, assoc_key, getSequelizeServiceInterfaceFor(this.getServiceFor(assocApiClass)).gqlFromDbModel(associatedModel));
            return Reflect.get(source, assoc_key);
        }
        return null;
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