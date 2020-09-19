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
exports.buildWebhookResolver = exports.RemoveWebhookInput = exports.RemoveSubscriptionPayload = exports.RemoveSubscriptionInput = exports.AddSubscriptionPayload = exports.AddSubscriptionInput = exports.RemoveWebhookPayload = exports.AddWebhookInput = exports.AddWebhookPayload = void 0;
const type_graphql_1 = require("type-graphql");
const base_resolver_1 = require("../../../gql/resolvers/base-resolver");
const notification_of_enum_1 = require("../../../gql/relay/notification-of.enum");
const rumbleship_context_1 = require("../../../app/rumbleship-context/rumbleship-context");
const create_node_notification_1 = require("../../../gql/resolvers/create-node-notification");
const typedi_1 = require("typedi");
const webhook_relay_1 = require("./webhook.relay");
const permissions_1 = require("../../permissions");
const inititialize_queued_subscription_relay_1 = require("../../inititialize-queued-subscription-relay");
const o11y_1 = require("@rumbleship/o11y");
const oid_1 = require("@rumbleship/oid");
const rumbleship_subscription_1 = require("../../../gql/resolvers/rumbleship-subscription");
const filter_by_subscription_filter_1 = require("../../../gql/resolvers/filter-by-subscription-filter");
const relay_mutation_1 = require("../../../gql/relay/relay_mutation");
const gql_1 = require("../../queued_subscription_request/gql");
const acl_1 = require("@rumbleship/acl");
let AddWebhookPayload = class AddWebhookPayload extends relay_mutation_1.withRelayMutationPayload(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => webhook_relay_1.Webhook),
    __metadata("design:type", webhook_relay_1.Webhook)
], AddWebhookPayload.prototype, "webhook", void 0);
AddWebhookPayload = __decorate([
    type_graphql_1.ObjectType()
], AddWebhookPayload);
exports.AddWebhookPayload = AddWebhookPayload;
let AddWebhookInput = class AddWebhookInput extends relay_mutation_1.withRelayMutationInput(relay_mutation_1.Empty) {
};
__decorate([
    acl_1.AuthorizerTreatAs([acl_1.Resource.Division, acl_1.Resource.User]),
    type_graphql_1.Field(type => type_graphql_1.ID, { nullable: false }),
    __metadata("design:type", String)
], AddWebhookInput.prototype, "owner_id", void 0);
__decorate([
    type_graphql_1.Field({ nullable: false }),
    __metadata("design:type", String)
], AddWebhookInput.prototype, "subscription_url", void 0);
AddWebhookInput = __decorate([
    type_graphql_1.InputType()
], AddWebhookInput);
exports.AddWebhookInput = AddWebhookInput;
let RemoveWebhookPayload = class RemoveWebhookPayload extends relay_mutation_1.withRelayMutationPayload(relay_mutation_1.Empty) {
};
RemoveWebhookPayload = __decorate([
    type_graphql_1.ObjectType()
], RemoveWebhookPayload);
exports.RemoveWebhookPayload = RemoveWebhookPayload;
let AddSubscriptionInput = class AddSubscriptionInput extends relay_mutation_1.withRelayMutationInput(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID, { nullable: false }),
    __metadata("design:type", String)
], AddSubscriptionInput.prototype, "webhook_id", void 0);
__decorate([
    type_graphql_1.Field({ nullable: false }),
    __metadata("design:type", String)
], AddSubscriptionInput.prototype, "gql_query_string", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], AddSubscriptionInput.prototype, "query_attributes", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], AddSubscriptionInput.prototype, "operation_name", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], AddSubscriptionInput.prototype, "subscription_name", void 0);
__decorate([
    type_graphql_1.Field(type => Boolean, { nullable: false }),
    __metadata("design:type", Boolean)
], AddSubscriptionInput.prototype, "active", void 0);
AddSubscriptionInput = __decorate([
    type_graphql_1.InputType()
], AddSubscriptionInput);
exports.AddSubscriptionInput = AddSubscriptionInput;
let AddSubscriptionPayload = class AddSubscriptionPayload extends relay_mutation_1.withRelayMutationPayload(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => gql_1.WebhookSubscription),
    __metadata("design:type", gql_1.WebhookSubscription)
], AddSubscriptionPayload.prototype, "webhookSubscription", void 0);
AddSubscriptionPayload = __decorate([
    type_graphql_1.ObjectType()
], AddSubscriptionPayload);
exports.AddSubscriptionPayload = AddSubscriptionPayload;
let RemoveSubscriptionInput = class RemoveSubscriptionInput extends relay_mutation_1.withRelayMutationInput(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID, { nullable: false }),
    __metadata("design:type", String)
], RemoveSubscriptionInput.prototype, "webhookId", void 0);
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID, { nullable: false }),
    __metadata("design:type", String)
], RemoveSubscriptionInput.prototype, "subscriptionId", void 0);
RemoveSubscriptionInput = __decorate([
    type_graphql_1.InputType()
], RemoveSubscriptionInput);
exports.RemoveSubscriptionInput = RemoveSubscriptionInput;
let RemoveSubscriptionPayload = class RemoveSubscriptionPayload extends relay_mutation_1.withRelayMutationPayload(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => webhook_relay_1.Webhook),
    __metadata("design:type", webhook_relay_1.Webhook)
], RemoveSubscriptionPayload.prototype, "webhook", void 0);
RemoveSubscriptionPayload = __decorate([
    type_graphql_1.ObjectType()
], RemoveSubscriptionPayload);
exports.RemoveSubscriptionPayload = RemoveSubscriptionPayload;
let RemoveWebhookInput = class RemoveWebhookInput extends relay_mutation_1.withRelayMutationInput(relay_mutation_1.Empty) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID, { nullable: false }),
    __metadata("design:type", String)
], RemoveWebhookInput.prototype, "webhookId", void 0);
RemoveWebhookInput = __decorate([
    type_graphql_1.InputType()
], RemoveWebhookInput);
exports.RemoveWebhookInput = RemoveWebhookInput;
function buildWebhookResolver(config) {
    const prefix = inititialize_queued_subscription_relay_1.getRelayPrefixLowerCase();
    const baseName = prefix
        ? `${prefix}${inititialize_queued_subscription_relay_1.getWebhookScopeName()}`
        : inititialize_queued_subscription_relay_1.getWebhookScopeName().toLowerCase();
    const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
    let WebhookResolver = class WebhookResolver extends base_resolver_1.GQLBaseResolver {
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
        async addWebhook(input) {
            return relay_mutation_1.setClientMutationIdOnPayload(input, async () => {
                const addWebhookPayload = new AddWebhookPayload();
                addWebhookPayload.webhook = await this.service.addWebhook(config, input, {});
                return addWebhookPayload;
            });
        }
        async removeWebhook(input) {
            return relay_mutation_1.setClientMutationIdOnPayload(input, async () => {
                const removeWebhookPayload = new RemoveWebhookPayload();
                await this.service.removeWebhook(input.webhookId, {});
                return removeWebhookPayload;
            });
        }
        async addSubscription(input) {
            return relay_mutation_1.setClientMutationIdOnPayload(input, async () => {
                const addSubscriptionPayload = new AddSubscriptionPayload();
                const { webhook_id, ...subscriptionInput } = input;
                addSubscriptionPayload.webhookSubscription = await this.service.addSubscription(webhook_id, subscriptionInput, {});
                return addSubscriptionPayload;
            });
        }
        async removeSubscription(input) {
            return relay_mutation_1.setClientMutationIdOnPayload(input, async () => {
                const removesubscriptionPayload = new RemoveSubscriptionPayload();
                removesubscriptionPayload.webhook = await this.service.removeSubscription(input.webhookId, input.subscriptionId, {});
                return removesubscriptionPayload;
            });
        }
        /**
         * A more complex subscription than normal, as we are subscribing to a topic that receives all of the
         * changes to Webhook models across all the the instances of microservices that use
         * this library.
         *
         * @param rawPayload
         *
         * @param args
         */
        async onChange(rawPayload, args) {
            return create_node_notification_1.createNodeNotification(rawPayload, this, webhook_relay_1.WebhookNotification);
        }
        async webhookSubscriptions(ctx, aWebhook, filter) {
            return this.service.getWebhookSubscriptionsFor(aWebhook, filter, {});
        }
    };
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Query(type => webhook_relay_1.WebhookConnection, { name: `${baseName}s` }),
        __param(0, type_graphql_1.Args(type => webhook_relay_1.WebhookFilter)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [webhook_relay_1.WebhookFilter]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "getAll", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Query(type => webhook_relay_1.Webhook, { name: `${baseName}` }),
        __param(0, type_graphql_1.Arg('id', type => type_graphql_1.ID)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "getOne", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Mutation(type => AddWebhookPayload, { name: `add${capitalizedName}` }),
        __param(0, type_graphql_1.Arg('input', type => AddWebhookInput)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [AddWebhookInput]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "addWebhook", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Mutation(type => RemoveWebhookPayload, {
            description: 'warning: not completely implemented. deactivate associated qsrs manually',
            name: `remove${capitalizedName}`
        }),
        __param(0, type_graphql_1.Arg('input', type => RemoveWebhookInput)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [RemoveWebhookInput]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "removeWebhook", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Mutation(type => AddSubscriptionPayload, { name: `add${capitalizedName}Subscription` }),
        __param(0, type_graphql_1.Arg('input', type => AddSubscriptionInput)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [AddSubscriptionInput]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "addSubscription", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.Mutation(type => RemoveSubscriptionPayload, {
            name: `remove${capitalizedName}SubscriptionFor`
        }),
        __param(0, type_graphql_1.Arg('input', type => RemoveSubscriptionInput)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [RemoveSubscriptionInput]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "removeSubscription", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        rumbleship_subscription_1.RumbleshipSubscription(type => webhook_relay_1.WebhookNotification, {
            name: `on${capitalizedName}Change`,
            topics: [`${notification_of_enum_1.NODE_CHANGE_NOTIFICATION}_${inititialize_queued_subscription_relay_1.getWebhookScopeName()}`],
            filter: async ({ payload, args, context }) => {
                const nodePayload = JSON.parse(payload.data.toString());
                const oid = new oid_1.Oid(nodePayload.oid);
                if (!inititialize_queued_subscription_relay_1.isWebhookOidForThisService(oid)) {
                    return false;
                }
                return filter_by_subscription_filter_1.filterBySubscriptionFilter({ payload, args, context });
            },
            nullable: true
        }),
        __param(0, type_graphql_1.Root()),
        __param(1, type_graphql_1.Args()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, webhook_relay_1.WebhookFilterForSubscriptions]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "onChange", null);
    __decorate([
        o11y_1.AddToTrace(),
        type_graphql_1.Authorized(permissions_1.ResolverPermissions.Webhook.default),
        type_graphql_1.FieldResolver(type => gql_1.QueuedSubscriptionRequestConnection),
        __param(0, type_graphql_1.Ctx()),
        __param(1, type_graphql_1.Root()),
        __param(2, type_graphql_1.Args(type => gql_1.QueuedSubscriptionRequestFilter)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext,
            webhook_relay_1.Webhook,
            gql_1.QueuedSubscriptionRequestFilter]),
        __metadata("design:returntype", Promise)
    ], WebhookResolver.prototype, "webhookSubscriptions", null);
    WebhookResolver = __decorate([
        typedi_1.Service(),
        type_graphql_1.Resolver(resolverOf => webhook_relay_1.Webhook),
        __param(0, typedi_1.Inject(`${inititialize_queued_subscription_relay_1.getWebhookScopeName()}Service`)),
        __metadata("design:paramtypes", [Object])
    ], WebhookResolver);
    return WebhookResolver;
}
exports.buildWebhookResolver = buildWebhookResolver;
//# sourceMappingURL=webhook.resolver.js.map