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
exports.NodeResolver = void 0;
const typedi_1 = require("typedi");
const type_graphql_1 = require("type-graphql");
const oid_1 = require("@rumbleship/oid");
const o11y_1 = require("@rumbleship/o11y");
const relay_1 = require("../relay");
const create_node_notification_1 = require("./create-node-notification");
const rumbleship_subscription_1 = require("./rumbleship-subscription");
const with_subscription_filter_mixin_1 = require("../relay/mixins/with-subscription-filter.mixin");
const filter_by_subscription_filter_1 = require("./filter-by-subscription-filter");
class Empty {
}
class NodeSubscriptionFilter extends with_subscription_filter_mixin_1.withSubscriptionFilter(relay_1.withTimeStampsFilter(Empty), 'NodeSubscriptionWatchList') {
}
// we make a specific concreate type here for the concrete general Node notification
let ClassGqlNodeNotification = class ClassGqlNodeNotification extends relay_1.NodeNotification {
    constructor(notificationOf, idempotency_key, node) {
        super(notificationOf, idempotency_key, node);
    }
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.Int),
    __metadata("design:type", String)
], ClassGqlNodeNotification.prototype, "idempotency_key", void 0);
__decorate([
    type_graphql_1.Field(type => relay_1.NotificationOf),
    __metadata("design:type", String)
], ClassGqlNodeNotification.prototype, "notificationOf", void 0);
__decorate([
    type_graphql_1.Field(type => relay_1.Node, { nullable: true }),
    __metadata("design:type", relay_1.Node)
], ClassGqlNodeNotification.prototype, "node", void 0);
ClassGqlNodeNotification = __decorate([
    type_graphql_1.ObjectType(),
    __metadata("design:paramtypes", [String, String, relay_1.Node])
], ClassGqlNodeNotification);
let NodeResolver = class NodeResolver {
    constructor(
    // constructor injection of service
    nodeServices) {
        this.nodeServices = nodeServices;
    }
    // to conform with the Relay Connection spec
    // this is the generic resolver givin an ID, it can always resolcve to one of the domain objects..
    async node(oidString, ctx) {
        const oid = new oid_1.Oid(oidString);
        const { scope } = oid.unwrap();
        if (scope in this.nodeServices) {
            return Reflect.get(this.nodeServices, scope).getOne(oid);
        }
        throw Error('Invalid OID. Scope:' + scope);
    }
    publishLastKnownState(oidString, pubSub, ctx) {
        const oid = new oid_1.Oid(oidString);
        const { scope } = oid.unwrap();
        if (scope in this.nodeServices) {
            Reflect.get(this.nodeServices, scope).publishLastKnownState(oid);
        }
        return true;
    }
    async onChange(rawPayload, args) {
        const recieved = JSON.parse(rawPayload.data.toString());
        const strOid = recieved === null || recieved === void 0 ? void 0 : recieved.oid;
        const oid = new oid_1.Oid(strOid);
        const { scope } = oid.unwrap();
        if (scope in this.nodeServices) {
            const service = Reflect.get(this.nodeServices, scope);
            return create_node_notification_1.createNodeNotification(rawPayload, service, ClassGqlNodeNotification);
        }
        throw Error('Invalid OID. Scope: ' + scope);
    }
    // for developers and system support,
    async unWrapOid(oidString, ctx) {
        const oid = new oid_1.Oid(oidString);
        const { scope, id } = oid.unwrap();
        return scope + ':' + id;
    }
    async makeOid(scope, id, ctx) {
        const oid = oid_1.Oid.Create(scope, `${id}`);
        return oid.toString();
    }
};
__decorate([
    o11y_1.AddToTrace(),
    type_graphql_1.Query(returns => relay_1.Node, { nullable: true }),
    __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)), __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NodeResolver.prototype, "node", null);
__decorate([
    o11y_1.AddToTrace(),
    type_graphql_1.Mutation(returns => Boolean),
    __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)),
    __param(1, type_graphql_1.PubSub()),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, type_graphql_1.PubSubEngine, Object]),
    __metadata("design:returntype", Boolean)
], NodeResolver.prototype, "publishLastKnownState", null);
__decorate([
    rumbleship_subscription_1.RumbleshipSubscription(type => ClassGqlNodeNotification, {
        name: `onNodeChange`,
        topics: `${relay_1.NODE_CHANGE_NOTIFICATION}`,
        filter: filter_by_subscription_filter_1.filterBySubscriptionFilter,
        nullable: true
    }),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Args(type => NodeSubscriptionFilter)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, NodeSubscriptionFilter]),
    __metadata("design:returntype", Promise)
], NodeResolver.prototype, "onChange", null);
__decorate([
    type_graphql_1.Query(returns => String),
    __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)), __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NodeResolver.prototype, "unWrapOid", null);
__decorate([
    type_graphql_1.Query(returns => String),
    __param(0, type_graphql_1.Arg('scope', type => String)),
    __param(1, type_graphql_1.Arg('id', type => String)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], NodeResolver.prototype, "makeOid", null);
NodeResolver = __decorate([
    typedi_1.Service(),
    type_graphql_1.Resolver(),
    __param(0, typedi_1.Inject('nodeServices')),
    __metadata("design:paramtypes", [Array])
], NodeResolver);
exports.NodeResolver = NodeResolver;
//# sourceMappingURL=node-resolver.js.map