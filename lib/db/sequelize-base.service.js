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
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const gql_1 = require("../gql");
const index_1 = require("./index");
const base64_1 = require("../helpers/base64");
const model_to_class_1 = require("./model-to-class");
const gql_pubsub_sequelize_engine_1 = require("./gql-pubsub-sequelize-engine");
const sequelize_1 = require("sequelize");
const iterable_model_1 = require("iterable-model");
const acl_1 = require("@rumbleship/acl");
let SequelizeBaseService = class SequelizeBaseService {
    constructor(apiClass, edgeClass, connectionClass, model, ctx, options) {
        this.apiClass = apiClass;
        this.edgeClass = edgeClass;
        this.connectionClass = connectionClass;
        this.model = model;
        this.ctx = ctx;
        this.options = options;
        this.permissions = options.permissions;
    }
    can(params) {
        return ((params.options && params.options.transaction) ||
            this.ctx.authorizer.can(params.action, params.authorizable, [this.permissions], params.attribute, params.resource));
    }
    setServiceRegister(services) {
        this.nodeServices = services;
    }
    nodeType() {
        return this.apiClass.constructor.name;
    }
    gqlFromDbModel(dbModel) {
        if (this.options.apiClassFactory) {
            return this.options.apiClassFactory.makeFrom(dbModel, this);
        }
        else {
            return model_to_class_1.modelToClass(this, this.apiClass, dbModel);
        }
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
            autocommit: params.autocommit
        });
        return txn;
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
        const { after, before, first, last, ...filter } = filterBy;
        // we hold cursors as base64 of the offset for this query... not perfect,
        // but good enough for now
        // see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
        // However... we only support before OR after.
        //
        const connection = new this.connectionClass();
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: filter, options })) {
            const limits = index_1.calculateLimitAndOffset(after, first, before, last);
            const whereClause = gql_1.Oid.createWhereClauseWith(filter);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const { rows, count } = await this.model.findAndCountAll({
                where: whereClause,
                offset: limits.offset,
                limit: limits.limit,
                ...sequelizeOptions
            });
            // prime the cache
            // this.sequelizeDataloaderCtx.prime(rows);
            const { pageBefore, pageAfter } = index_1.calculateBeforeAndAfter(limits.offset, limits.limit, count);
            const edges = rows.map(instance => this.makeEdge(base64_1.toBase64(limits.offset++), this.gqlFromDbModel(instance)));
            connection.addEdges(edges, pageAfter, pageBefore);
        }
        else {
            connection.addEdges([], false, false);
        }
        return connection;
    }
    async findOne(filterBy, options) {
        const { ...filter } = filterBy;
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: filter, options })) {
            const matched = await this.getAll(filterBy, options);
            if (matched.edges.length) {
                return matched.edges[0].node;
            }
        }
        return null;
    }
    async findEach(filterBy, apply, options) {
        const { after, before, first, last, ...filter } = filterBy;
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: filter, options })) {
            const whereClause = gql_1.Oid.createWhereClauseWith(filter);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const modelFindEach = iterable_model_1.findEach.bind(this.model);
            modelFindEach({
                where: whereClause,
                ...sequelizeOptions
            }, (model) => {
                apply(this.gqlFromDbModel(model));
            });
        }
        throw new acl_1.RFIAuthError();
    }
    async count(filterBy, options) {
        const { ...filter } = filterBy;
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: filter, options })) {
            return this.model.count({
                where: filterBy
            });
        }
        throw new acl_1.RFIAuthError();
    }
    async getOne(oid, options) {
        const { id } = oid.unwrap();
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const instance = await this.model.findByPk(id, sequelizeOptions);
        if (!instance) {
            throw new Error(`${this.apiClass.constructor.name}: oid(${oid}) not found`);
        }
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: instance, options })) {
            return this.gqlFromDbModel(instance);
        }
        throw new acl_1.RFIAuthError();
    }
    async publishLastKnownState(oid) {
        const { id } = oid.unwrap();
        const instance = await this.model.findByPk(id);
        if (!instance) {
            throw new Error(`${this.apiClass.constructor.name}: oid(${oid}) not found`);
        }
        if (this.can({ action: acl_1.Actions.QUERY, authorizable: instance })) {
            gql_pubsub_sequelize_engine_1.publishCurrentState(instance);
        }
        throw new acl_1.RFIAuthError();
    }
    async create(data, options) {
        if (this.can({ action: acl_1.Actions.CREATE, authorizable: data, options })) {
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const instance = await this.model.create(data, sequelizeOptions);
            return this.gqlFromDbModel(instance);
        }
        throw new acl_1.RFIAuthError();
    }
    async update(data, options) {
        if (data.id) {
            const { id } = new gql_1.Oid(data.id).unwrap();
            delete data.id;
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            const node = await this.model.findByPk(id, sequelizeOptions);
            if (this.can({ action: acl_1.Actions.UPDATE, authorizable: node, options })) {
                if (!node) {
                    throw new Error('Account not found');
                }
                await node.update(data, sequelizeOptions);
                return this.gqlFromDbModel(node);
            }
            throw new acl_1.RFIAuthError();
        }
        throw new Error(`Invalid ${this.apiClass.name}: No id`);
    }
    /* <TAssocApi extends Node,
      TAssocConnection extends Connection<TAssocApi>,
      TAssocEdge extends Edge<TAssocApi>,
      TAssocModel
      > */
    async getAssociatedMany(source, assoc_key, filterBy, assocApiClass, assocEdgeClass, assocConnectionClass, options) {
        const { after, before, first, last, ...filter } = filterBy;
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = gql_1.Oid.createWhereClauseWith(filter);
        let sourceModel;
        let count = 0;
        let associated;
        if (model_to_class_1.modelKey in source) {
            sourceModel = Reflect.get(source, model_to_class_1.modelKey);
            const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
            count = await sourceModel.$count(assoc_key, {
                where: whereClause
            });
            const result = await sourceModel.$get(assoc_key, {
                offset: limits.offset,
                limit: limits.limit,
                where: whereClause,
                ...sequelizeOptions
            });
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
            edge.node = this.getServiceFor(assocApiClass).gqlFromDbModel(instance);
            return edge;
        });
        const connection = new assocConnectionClass();
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async getAssociated(source, assoc_key, assocApiClass, options) {
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
        const sequelizeOptions = this.convertServiceOptionsToSequelizeOptions(options);
        const associatedModel = (await sourceModel.$get(assoc_key, sequelizeOptions));
        if (associatedModel) {
            Reflect.set(source, assoc_key, this.getServiceFor(assocApiClass).gqlFromDbModel(associatedModel));
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
SequelizeBaseService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], SequelizeBaseService);
exports.SequelizeBaseService = SequelizeBaseService;
//# sourceMappingURL=sequelize-base.service.js.map