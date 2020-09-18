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
exports.buildQueuedSubscriptionRequestResolver = void 0;
const type_graphql_1 = require("type-graphql");
const base_resolver_1 = require("../../../gql/resolvers/base-resolver");
const notification_of_enum_1 = require("../../../gql/relay/notification-of.enum");
const rumbleship_context_1 = require("../../../app/rumbleship-context/rumbleship-context");
const create_node_notification_1 = require("../../../gql/resolvers/create-node-notification");
const typedi_1 = require("typedi");
// eslint-disable-next-line import/no-cycle
const queued_subscription_request_relay_1 = require("./queued-subscription-request.relay");
const permissions_1 = require("../../permissions");
const inititialize_queued_subscription_relay_1 = require("../../inititialize-queued-subscription-relay");
const o11y_1 = require("@rumbleship/o11y");
const oid_1 = require("@rumbleship/oid");
const rumbleship_subscription_1 = require("../../../gql/resolvers/rumbleship-subscription");
const filter_by_subscription_filter_1 = require("../../../gql/resolvers/filter-by-subscription-filter");
// eslint-disable-next-line import/no-cycle
const webhook_relay_1 = require("../../webhook/gql/webhook.relay");
function buildQueuedSubscriptionRequestResolver() {
    const baseName = `${inititialize_queued_subscription_relay_1.getRelayPrefixLowerCase()}${inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()}`;
    const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
    let QueuedSubscriptionRequestResolver = class QueuedSubscriptionRequestResolver extends base_resolver_1.GQLBaseResolver {
        constructor(service) {
            super(service);
            this.service = service;
        }
        async getAll(filterBy) {
            return super.getAll(filterBy);
        }
        async getOne(id) {
            return super.getOne(id);
        }
        async create(input) {
            const ctx = this.service.getContext();
            input.marshalled_acl = ctx.authorizer.marshalClaims();
            if (!input.owner_id) {
                input.owner_id = ctx.authorizer.getUser();
            }
            return super.create(input);
        }
        async update(input) {
            return super.update(input);
        }
        /**
         * A more complex subscription than normal, as we are subscribing to a topic that receives all of the
         * changes to QueuedSubscriptionRequest models across all the the instances of microservices that use
         * this library.
         *
         * @param rawPayload
         *
         * @param args
         */
        async onChange(rawPayload, args) {
            return create_node_notification_1.createNodeNotification(rawPayload, this, queued_subscription_request_relay_1.QueuedSubscriptionRequestNotification);
        }
        async webhook(ctx, aWebhookSubscription) {
            return this.service.getWebhookFor(aWebhookSubscription, {});
        }
    };
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.QueuedSubscriptionRequest.default),
        type_graphql_1.Query(type => queued_subscription_request_relay_1.QueuedSubscriptionRequestConnection, { name: `${baseName}s` }),
        __param(0, type_graphql_1.Args(type => queued_subscription_request_relay_1.QueuedSubscriptionRequestFilter)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [queued_subscription_request_relay_1.QueuedSubscriptionRequestFilter]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "getAll", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.QueuedSubscriptionRequest.default),
        type_graphql_1.Query(type => queued_subscription_request_relay_1.QueuedSubscriptionRequest, { name: `${baseName}` }),
        __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "getOne", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.QueuedSubscriptionRequest.default),
        type_graphql_1.Mutation(type => queued_subscription_request_relay_1.QueuedSubscriptionRequest, { name: `add${capitalizedName}` }),
        __param(0, type_graphql_1.Arg('input', type => queued_subscription_request_relay_1.QueuedSubscriptionRequestInput)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [queued_subscription_request_relay_1.QueuedSubscriptionRequestInput]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "create", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.QueuedSubscriptionRequest.default),
        type_graphql_1.Mutation(type => queued_subscription_request_relay_1.QueuedSubscriptionRequest, { name: `update${capitalizedName}` }),
        __param(0, type_graphql_1.Arg('input', type => queued_subscription_request_relay_1.QueuedSubscriptionRequestUpdate)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [queued_subscription_request_relay_1.QueuedSubscriptionRequestUpdate]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "update", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.QueuedSubscriptionRequest.default),
        rumbleship_subscription_1.RumbleshipSubscription(type => queued_subscription_request_relay_1.QueuedSubscriptionRequestNotification, {
            name: `on${capitalizedName}Change`,
            topics: [`${notification_of_enum_1.NODE_CHANGE_NOTIFICATION}_${inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()}`],
            filter: async ({ payload, args, context }) => {
                const nodePayload = JSON.parse(payload.data.toString());
                const oid = new oid_1.Oid(nodePayload.oid);
                if (!inititialize_queued_subscription_relay_1.isQueuedSubscriptionOidForThisService(oid)) {
                    return false;
                }
                return filter_by_subscription_filter_1.filterBySubscriptionFilter({ payload, args, context });
            },
            nullable: true
        }),
        __param(0, type_graphql_1.Root()),
        __param(1, type_graphql_1.Args()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, queued_subscription_request_relay_1.QueuedSubscriptionRequestFilterForSubscriptions]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "onChange", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.FieldResolver(type => webhook_relay_1.Webhook, { nullable: true }),
        __param(0, type_graphql_1.Ctx()),
        __param(1, type_graphql_1.Root()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext,
            queued_subscription_request_relay_1.QueuedSubscriptionRequest]),
        __metadata("design:returntype", Promise)
    ], QueuedSubscriptionRequestResolver.prototype, "webhook", null);
    QueuedSubscriptionRequestResolver = __decorate([
        typedi_1.Service(),
        type_graphql_1.Resolver(resolverOf => queued_subscription_request_relay_1.QueuedSubscriptionRequest),
        __param(0, typedi_1.Inject(`${inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()}Service`)),
        __metadata("design:paramtypes", [Object])
    ], QueuedSubscriptionRequestResolver);
    return QueuedSubscriptionRequestResolver;
}
exports.buildQueuedSubscriptionRequestResolver = buildQueuedSubscriptionRequestResolver;
//# sourceMappingURL=queued-subscription-request.resolver.js.map