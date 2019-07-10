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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const type_graphql_1 = require("type-graphql");
const index_1 = require("./index");
const node_notification_1 = require("./node-notification");
class GQLBaseResolver {
    constructor(service) {
        this.service = service;
    }
    async getAll(filterBy) {
        return this.service.getAll(filterBy);
    }
    async getOne(id) {
        return this.service.getOne(new index_1.Oid(id));
    }
    async create(input) {
        return this.service.create(input);
    }
    async update(input) {
        return this.service.update(input);
    }
}
exports.GQLBaseResolver = GQLBaseResolver;
function createBaseResolver(baseName, objectTypeCls, connectionTypeCls, filterClsType, inputClsType, updateClsType, notificationClsType, permissions) {
    const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
    let BaseResolver = class BaseResolver extends GQLBaseResolver {
        constructor(service) {
            super(service);
        }
        // @Authorized(permissions)
        async getAll(filterBy) {
            return super.getAll(filterBy);
        }
        async getOne(id) {
            return super.getOne(id);
        }
        async create(input) {
            return super.create(input);
        }
        async update(input) {
            return super.update(input);
        }
        async onChange(payload) {
            // convert to GQL Model
            const modelId = payload.model.get('id');
            const oid = index_1.Oid.create(objectTypeCls.name, modelId);
            const node = await this.getOne(oid.toString());
            const gqlNodeNotification = new notificationClsType(payload.notificationOf, node);
            return gqlNodeNotification;
        }
    };
    __decorate([
        type_graphql_1.Query(type => connectionTypeCls, { name: `${baseName}s` }),
        __param(0, type_graphql_1.Args(type => filterClsType)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "getAll", null);
    __decorate([
        type_graphql_1.Query(type => objectTypeCls, { name: `${baseName}` }),
        __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "getOne", null);
    __decorate([
        type_graphql_1.Mutation(type => objectTypeCls, { name: `add${capitalizedName}` }),
        __param(0, type_graphql_1.Arg('input', type => inputClsType)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "create", null);
    __decorate([
        type_graphql_1.Mutation(type => objectTypeCls, { name: `update${capitalizedName}` }),
        __param(0, type_graphql_1.Arg('input', type => updateClsType)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "update", null);
    __decorate([
        type_graphql_1.Subscription(type => notificationClsType, {
            name: `on${capitalizedName}Change`,
            topics: `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${capitalizedName}Model`,
            nullable: true
        }),
        __param(0, type_graphql_1.Root()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [node_notification_1.DbModelChangeNotification]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "onChange", null);
    BaseResolver = __decorate([
        type_graphql_1.Resolver({ isAbstract: true }),
        __metadata("design:paramtypes", [Object])
    ], BaseResolver);
    return BaseResolver;
}
exports.createBaseResolver = createBaseResolver;
function createReadOnlyBaseResolver(baseName, objectTypeCls, connectionTypeCls, filterClsType, notificationClsType) {
    const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
    let BaseResolver = class BaseResolver extends GQLBaseResolver {
        constructor(service) {
            super(service);
        }
        async getAll(filterBy) {
            return super.getAll(filterBy);
        }
        async getOne(id) {
            return super.getOne(id);
        }
        async onChange(payload) {
            // convert to GQL Model
            const modelId = payload.model.get('id');
            const oid = index_1.Oid.create(objectTypeCls.name, modelId);
            const node = await this.getOne(oid.toString());
            const gqlNodeNotification = new notificationClsType(payload.notificationOf, node);
            return gqlNodeNotification;
        }
    };
    __decorate([
        type_graphql_1.Query(type => connectionTypeCls, { name: `${baseName}s` }),
        __param(0, type_graphql_1.Args(type => filterClsType)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "getAll", null);
    __decorate([
        type_graphql_1.Query(type => objectTypeCls, { name: `${baseName}` }),
        __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "getOne", null);
    __decorate([
        type_graphql_1.Subscription(type => notificationClsType, {
            name: `on${capitalizedName}Change`,
            topics: `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${capitalizedName}Model`,
            nullable: true
        }),
        __param(0, type_graphql_1.Root()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [node_notification_1.DbModelChangeNotification]),
        __metadata("design:returntype", Promise)
    ], BaseResolver.prototype, "onChange", null);
    BaseResolver = __decorate([
        type_graphql_1.Resolver({ isAbstract: true }),
        __metadata("design:paramtypes", [Object])
    ], BaseResolver);
    return BaseResolver;
}
exports.createReadOnlyBaseResolver = createReadOnlyBaseResolver;
//# sourceMappingURL=base.resolver.js.map