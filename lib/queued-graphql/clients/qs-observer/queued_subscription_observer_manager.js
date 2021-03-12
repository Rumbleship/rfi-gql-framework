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
exports.QueuedSubscriptionObserverManager = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
const o11y_1 = require("@rumbleship/o11y");
const graphql_1 = require("graphql");
const rumbleship_context_1 = require("../../../app/rumbleship-context");
const shared_1 = require("../../shared");
const queued_gql_request_client_1 = require("../gql-request/queued-gql-request-client");
const sync_qsr_interface_1 = require("./sync_qsr.interface");
const q_s_observer_1 = require("./q_s_observer");
/**
 * Each service has its own pubsub topic that subscription responses are sent to. We subscribe to this
 * topic using a 'service' subscription (ie each message is handled by a single instance)
 *
 * On initialization, we send out all the QSR's defined in the observers on a createOrUpdate mutation to
 * ensure that the Qsr Managament service has the latest version of a Qsr and the responding service is updated
 *
 */
class QueuedSubscriptionObserverManager {
    constructor(config, observers) {
        this.config = config;
        this.observers = observers;
        this.handlers = new Map();
        this._initialized = false;
        const pubsub = new pubsub_1.PubSub(this.config.Gcp.Auth);
        pubsub.projectId = pubsub.projectId.replace('-private', '-public');
        this.qsrTopicName = `${this.config.PubSub.topicPrefix}_QSR_PUBLISH_TO.${config.serviceName}`;
        // Only one instance of the service listens to this...But each version of the service live has its own subscription
        // this ensures that if a new QueuedSubscription is live, any versions trhat are live will all get the mesage
        // and are free to discard
        this.qsrSubscriptionName = `${this.qsrTopicName}.${config.Gcp.gaeVersion}`;
        // define the gcloud topic and subscription to observe (all qsrs for *this* service use the same topic)
        this.qsr_subscription = new shared_1.RfiPubSubSubscription(config, pubsub, this.qsrTopicName, this.qsrSubscriptionName, false
        // @todo(isaac): Consider ramifications of enabling this. Should be zero, but...
        // {
        //   enableOpenTelemetryTracing: true
        // }
        );
        this.queuedGqlRequestClient = new queued_gql_request_client_1.QueuedGqlRequestClientSingleInstanceResponder(config);
    }
    setHandlers(observers) {
        this.handlers = new Map(observers
            .map(observer => q_s_observer_1.getQsoHandlers(observer))
            .flat()
            .map(handler => [handler.qso_metadata.subscription_name, handler]));
    }
    async init(ctx) {
        this.setHandlers(this.observers);
        await this.qsr_subscription.init();
        await this.syncQsrs(ctx);
        this._initialized = true;
    }
    /**
     * This function takes all the decorated Qso metadata and creates
     * QSR definitions that are then sent to the qsr system if then are new,
     * they are created, if needed they are updated.
     *
     * Any change will be broadcast to all the Qsr's services and the running
     * QSR will be updated or created
     */
    async syncQsrs(ctx) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void this.queuedGqlRequestClient.start();
        for (const handler of this.handlers.values()) {
            await this.syncQsr(ctx, handler.qso_metadata);
        }
    }
    async syncQsr(ctx, qso_metadata) {
        const client_request_id = `${this.config.serviceName}.syncQsrs`;
        const marshalled_acl = ctx.authorizer.marshalClaims();
        const owner_id = ctx.authorizer.getUser();
        const gql_query_string = typeof qso_metadata.gql_document === 'string'
            ? qso_metadata.gql_document
            : graphql_1.print(qso_metadata.gql_document);
        const queryAttributes = {
            subscription_name: qso_metadata.subscription_name,
            gql_query_string,
            operation_name: qso_metadata.operation_name,
            active: qso_metadata.active,
            marshalled_acl: marshalled_acl,
            owner_id: owner_id,
            publish_to_topic_name: this.qsrTopicName,
            query_attributes: qso_metadata.query_attributes
        };
        ctx.beeline.addTraceContext({ qso: queryAttributes });
        // we dont care about the response, so let default do nothing handler act
        await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id,
            respond_on_error: false,
            gql_query_string: graphql_1.print(sync_qsr_interface_1.syncQsrGql),
            query_attributes: JSON.stringify(queryAttributes)
        });
    }
    async start(ctx) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void this.qsr_subscription.start((ctx, message) => {
            return this.message_dispatcher(ctx, message);
        });
    }
    async stop(ctx) {
        var _a, _b;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void ((_a = this.qsr_subscription) === null || _a === void 0 ? void 0 : _a.stop());
        void ((_b = this.queuedGqlRequestClient) === null || _b === void 0 ? void 0 : _b.stop());
    }
    /**
     *
     * @param ctx
     * @param response
     */
    async message_dispatcher(ctx, message) {
        ctx.beeline.addTraceContext({
            message
        });
        const handler = this.handlers.get(message.subscription_name);
        if (handler && handler.observer_class) {
            // We use typedi to construct the resolver..
            const observer = ctx.container.get(handler.observer_class);
            const hndlr = handler.handler.bind(observer);
            return hndlr(ctx, message);
        }
    }
}
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "init", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "syncQsrs", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "syncQsr", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "start", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "stop", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscriptionObserverManager.prototype, "message_dispatcher", null);
exports.QueuedSubscriptionObserverManager = QueuedSubscriptionObserverManager;
//# sourceMappingURL=queued_subscription_observer_manager.js.map