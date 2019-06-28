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
let SequelizeBaseService = class SequelizeBaseService {
    constructor(apiClass, edgeClass, connectionClass, model, ctx, apiClassFactory) {
        this.apiClass = apiClass;
        this.edgeClass = edgeClass;
        this.connectionClass = connectionClass;
        this.model = model;
        this.ctx = ctx;
        this.apiClassFactory = apiClassFactory;
    }
    setServiceRegister(services) {
        this.nodeServices = services;
    }
    nodeType() {
        return this.apiClass.constructor.name;
    }
    gqlFromDbModel(dbModel) {
        if (this.apiClassFactory) {
            return this.apiClassFactory.makeFrom(dbModel, this);
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
    async getAll(filterBy, paranoid = true) {
        const { after, before, first, last, ...filter } = filterBy;
        // we hold cursors as base64 of the offset for this query... not perfect,
        // but good enough for now
        // see https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
        // However... we only support before OR after.
        //
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = gql_1.Oid.createWhereClauseWith(filter);
        const { rows, count } = await this.model.findAndCountAll({
            where: whereClause,
            offset: limits.offset,
            limit: limits.limit,
            paranoid
        });
        // prime the cache
        // this.sequelizeDataloaderCtx.prime(rows);
        const { pageBefore, pageAfter } = index_1.calculateBeforeAndAfter(limits.offset, limits.limit, count);
        const edges = rows.map(instance => this.makeEdge(base64_1.toBase64(limits.offset++), this.gqlFromDbModel(instance)));
        const connection = new this.connectionClass();
        connection.addEdges(edges, pageAfter, pageBefore);
        return connection;
    }
    async findOne(filterBy, paranoid = true) {
        const matched = await this.getAll(filterBy);
        if (matched.edges.length) {
            return matched.edges[0].node;
        }
        else {
            return null;
        }
    }
    async count(filterBy) {
        return this.model.count({
            where: filterBy
        });
    }
    async getOne(oid) {
        const { id } = oid.unwrap();
        const instance = await this.model.findByPk(id);
        if (!instance) {
            throw new Error(`${this.apiClass.constructor.name}: oid(${oid}) not found`);
        }
        return this.gqlFromDbModel(instance);
    }
    async create(data) {
        const instance = await this.model.create(data);
        return this.gqlFromDbModel(instance);
    }
    async update(data) {
        if (data.id) {
            const { id } = new gql_1.Oid(data.id).unwrap();
            delete data.id;
            const node = await this.model.findByPk(id);
            if (!node) {
                throw new Error('Account not found');
            }
            await node.update(data);
            return this.gqlFromDbModel(node);
        }
        throw new Error(`Invalid ${this.apiClass.name}: No id`);
    }
    /* <TAssocApi extends Node,
      TAssocConnection extends Connection<TAssocApi>,
      TAssocEdge extends Edge<TAssocApi>,
      TAssocModel
      > */
    async getAssociatedMany(source, assoc_key, filterBy, assocApiClass, assocEdgeClass, assocConnectionClass) {
        const { after, before, first, last, ...filter } = filterBy;
        const limits = index_1.calculateLimitAndOffset(after, first, before, last);
        const whereClause = gql_1.Oid.createWhereClauseWith(filter);
        let sourceModel;
        let count = 0;
        let associated;
        if (model_to_class_1.modelKey in source) {
            sourceModel = Reflect.get(source, model_to_class_1.modelKey);
            count = await sourceModel.$count(assoc_key, {
                where: whereClause
            });
            const result = await sourceModel.$get(assoc_key, {
                offset: limits.offset,
                limit: limits.limit,
                where: whereClause
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
    async getAssociated(source, assoc_key, assocApiClass) {
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
        const associatedModel = (await sourceModel.$get(assoc_key));
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
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, model_to_class_1.GqlSingleTableInheritanceFactory])
], SequelizeBaseService);
exports.SequelizeBaseService = SequelizeBaseService;
//# sourceMappingURL=sequelize-base.service.js.map