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
exports.WebhookServiceSequelize = void 0;
const typedi_1 = require("typedi");
// tslint:disable-next-line: no-circular-imports
const sequelize_base_service_1 = require("../../../db/service/sequelize-base.service");
const rumbleship_context_1 = require("../../../app/rumbleship-context/rumbleship-context");
const relay_interface_1 = require("../../../gql/relay/relay.interface");
const pubsub_1 = require("@google-cloud/pubsub");
const webhook_relay_1 = require("../gql/webhook.relay");
const webhook_model_1 = require("./webhook.model");
const acl_1 = require("@rumbleship/acl");
const oid_1 = require("@rumbleship/oid");
const queued_subscription_request_1 = require("../../queued_subscription_request");
const gcp_helpers_1 = require("../../../queued-subscription-server/helpers/gcp_helpers");
const permissions_1 = require("../../permissions");
let WebhookServiceSequelize = class WebhookServiceSequelize extends sequelize_base_service_1.SequelizeBaseService {
    constructor(context) {
        super(webhook_relay_1.Webhook, webhook_relay_1.WebhookEdge, webhook_relay_1.WebhookConnection, webhook_model_1.WebhookModel, context, {
            permissions: permissions_1.ServicePermissions.Webhook
        });
    }
    async addWebhook(config, input, opts) {
        if (this.can({
            action: acl_1.Actions.CREATE,
            authorizable: input,
            options: opts
        })) {
            const webhook = await this.addAuthorizationFiltersAndWrapWithTransaction({ opts: { ...opts, ...{ lockLevel: relay_interface_1.NodeServiceLock.UPDATE } } }, async (optionsWithTransactionAndAuth) => {
                const pubSubConfig = config.PubSub;
                const gcpConfig = config.Gcp;
                const webhookRelay = await this.create(input, optionsWithTransactionAndAuth);
                const webhookUpdate = new webhook_relay_1.WebhookUpdate();
                webhookUpdate.id = webhookRelay.id.toString();
                webhookUpdate.topic_name = `${pubSubConfig.topicPrefix}_${config.serviceName}webhooks_${webhookRelay.owner_id}_${webhookRelay.id.toString()}`;
                webhookUpdate.gcloud_subscription = webhookUpdate.topic_name;
                await this.createTopicAndSubscriptionForGooglePubSub(gcpConfig, webhookUpdate.topic_name, webhookUpdate.gcloud_subscription, webhookRelay.subscription_url);
                return await this.update(webhookUpdate, {
                    ...optionsWithTransactionAndAuth,
                    skipAuthorizationCheck: true
                });
            });
            return webhook;
        }
        throw new acl_1.RFIAuthError('Not Authorized!');
    }
    async removeWebhook(webhookId, opts) {
        return await this.addAuthorizationFiltersAndWrapWithTransaction({ opts: { ...opts, ...{ lockLevel: relay_interface_1.NodeServiceLock.UPDATE } } }, async (optionsWithTransactionAndAuth) => {
            const webhook = await this.getOne(new oid_1.Oid(webhookId), optionsWithTransactionAndAuth);
            const webhookModel = this.dbModelFromGql(webhook);
            // check that associated qsr is correctly managed
            await webhookModel.destroy({
                ...optionsWithTransactionAndAuth,
                ...{ skipAuthorizationCheck: true }
            });
        });
    }
    async addSubscription(webhookId, input, opts) {
        return await this.addAuthorizationFiltersAndWrapWithTransaction({ opts: { ...opts, ...{ lockLevel: relay_interface_1.NodeServiceLock.UPDATE } } }, async (optionsWithTransactionAndAuth) => {
            // QSR's publish directly onto the google pubsub without
            // going through the pubsub derivation we use for the graphQl
            // websocket subscriptions or the listening for model changes...
            //
            const webhook = await this.getOne(new oid_1.Oid(webhookId), optionsWithTransactionAndAuth);
            const qsrService = this.getServiceFor(queued_subscription_request_1.QueuedSubscriptionRequest);
            input.publish_to_topic_name = webhook.topic_name;
            input.owner_id = webhook.owner_id;
            input.marshalled_acl = this.ctx.authorizer.marshalClaims();
            const qsrRelay = await qsrService.create(input, {
                ...optionsWithTransactionAndAuth,
                skipAuthorizationCheck: true
            });
            const webhookModel = this.dbModelFromGql(webhook);
            const qsrModel = qsrService.dbModelFromGql(qsrRelay);
            await webhookModel.$add('webhookSubscription', qsrModel, {
                ...optionsWithTransactionAndAuth,
                ...{ skipAuthorizationCheck: true }
            });
            return qsrService.gqlFromDbModel(qsrModel);
        });
    }
    async removeSubscription(webhookId, subscriptionId, opts) {
        // deactivate the qsr subscription so no more events will be published
        // then delete it (paranoid is on, so we still have it)
        return await this.addAuthorizationFiltersAndWrapWithTransaction({ opts: { ...opts, ...{ lockLevel: relay_interface_1.NodeServiceLock.UPDATE } } }, async (optionsWithTransactionAndAuth) => {
            const webhook = await this.getOne(new oid_1.Oid(webhookId), optionsWithTransactionAndAuth);
            const qsrService = this.getServiceFor(queued_subscription_request_1.QueuedSubscriptionRequest);
            // deactivate the qsr so all publishing will stop
            const qsrRelay = await qsrService.update({ id: subscriptionId, active: false }, {
                ...optionsWithTransactionAndAuth,
                ...{ skipAuthorizationCheck: true }
            });
            // then mark as deleted
            const qsrModel = qsrService.dbModelFromGql(qsrRelay);
            await qsrModel.destroy({
                ...optionsWithTransactionAndAuth,
                ...{ skipAuthorizationCheck: true }
            });
            return webhook;
        });
    }
    async getWebhookSubscriptionsFor(aWebhook, filter, opts) {
        return super.getAssociatedMany(aWebhook, 'webhookSubscriptions', filter, queued_subscription_request_1.QueuedSubscriptionRequest, queued_subscription_request_1.QueuedSubscriptionRequestEdge, queued_subscription_request_1.QueuedSubscriptionRequestConnection, opts);
    }
    async createTopicAndSubscriptionForGooglePubSub(gcpConfig, topic_name, gcloud_subscription, subscription_url) {
        const googlePubSub = new pubsub_1.PubSub(gcpConfig.Auth);
        const topic = await gcp_helpers_1.gcpGetTopic(googlePubSub, topic_name);
        await gcp_helpers_1.gcpCreatePushSubscription(topic, gcloud_subscription, subscription_url, gcpConfig.pubSubInvokerServiceAccount);
    }
};
WebhookServiceSequelize = __decorate([
    typedi_1.Service() // Each Request gets its own instance
    ,
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext])
], WebhookServiceSequelize);
exports.WebhookServiceSequelize = WebhookServiceSequelize;
//# sourceMappingURL=webhook.service.js.map