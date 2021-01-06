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
exports.QueuedSubscription = void 0;
const graphql_1 = require("graphql");
const on_demand_rumbleship_context_1 = require("../../../app/rumbleship-context/on-demand-rumbleship-context");
const is_subscription_operation_1 = require("../../helpers/is-subscription-operation");
const pubsub_1 = require("@google-cloud/pubsub");
const gcp_helpers_1 = require("../../helpers/gcp_helpers");
const rumbleship_context_1 = require("../../../app/rumbleship-context");
const o11y_1 = require("@rumbleship/o11y");
const add_error_to_trace_context_1 = require("../../../app/honeycomb-helpers/add_error_to_trace_context");
class QueuedSubscription {
    /**
     * Throws errors if the subscriptionRequest is not valid
     * @param schema
     * @param subscriptionRequest
     * @param publishToTopicName
     * @param pesistent_id
     */
    constructor(schema, subscriptionRequest, config, googlePublisher = new pubsub_1.PubSub(config.Auth)) {
        var _a;
        this.schema = schema;
        this.googlePublisher = googlePublisher;
        this.googlePublisher.projectId = this.googlePublisher.projectId.replace('-private', '-public');
        // This object is a very longlived 'active' object, so we dont want to have
        // any unexpected side-effects of holding relay objects in memory and the
        // potential for large networks of objects and services never being garbage collected
        //
        //
        let id;
        ({
            gql_query_string: this.gql_query_string,
            query_attributes: this.query_attributes,
            operation_name: this.operation_name,
            publish_to_topic_name: this.publish_to_topic_name,
            subscription_name: this.subscription_name,
            marshalled_acl: this.marshalled_acl,
            onResponseHook: this.onResponseHook,
            create_unique_subscription: this.create_unique_subscription,
            active: this.active,
            cache_consistency_id: this.cache_consistency_id,
            serviced_by: this.serviced_by,
            id
        } = subscriptionRequest);
        this.owner_id = (_a = subscriptionRequest.owner_id) !== null && _a !== void 0 ? _a : '';
        if (!id) {
            throw new Error('Must have an id!');
        }
        this.id = id.toString();
        this.executionContext = QueuedSubscription.validateSubscriptionRequest(this.schema, this);
    }
    /**
     * static so it can be used to validate subscriptions at the point of API
     * Note: Does not validate that the queryAttibutes are valid.
     *
     * @param schema
     * @param subscriptionRequest
     */
    static validateSubscriptionRequest(schema, subscriptionRequest) {
        var _a;
        // parse will throw an error if there are any parse errors
        const gqlDocument = graphql_1.parse((_a = subscriptionRequest.gql_query_string) !== null && _a !== void 0 ? _a : '');
        const executionParams = { query: gqlDocument };
        if (!is_subscription_operation_1.isASubscriptionOperation(gqlDocument, subscriptionRequest.operation_name)) {
            throw new Error('query for subscription must be a graphql subscription');
        }
        const errors = graphql_1.validate(schema, gqlDocument, graphql_1.specifiedRules);
        if (errors.length) {
            // todo add explict tracing
            throw new Error(errors.toString());
        }
        if (subscriptionRequest.query_attributes) {
            // will throw if invalid
            executionParams.variables = JSON.parse(subscriptionRequest.query_attributes);
        }
        executionParams.operationName = subscriptionRequest.operation_name;
        return executionParams;
    }
    /**
     * publishes repsononses to the QueuedSubscriptionRequest
     */
    async publishResponse(ctx, response) {
        var _a, _b;
        ctx.beeline.addTraceContext({
            response,
            pubsub: { projectId: this.googlePublisher.projectId }
        });
        const subscription_name = (_a = this.subscription_name) !== null && _a !== void 0 ? _a : '';
        const message = {
            owner_id: (_b = this.owner_id) !== null && _b !== void 0 ? _b : '',
            subscription_name,
            subscription_id: this.id.toString(),
            subscription_response: response
        };
        const topic = await this.getTopic(ctx);
        ctx.beeline.addTraceContext({
            topic: { name: topic.name },
            subscription: { name: subscription_name, id: message.subscription_id }
        });
        const payload = JSON.stringify(message);
        return topic.publish(Buffer.from(payload));
    }
    async getTopic(ctx) {
        if (!this._topic) {
            this._topic = await gcp_helpers_1.gcpGetTopic(this.googlePublisher, this.publish_to_topic_name);
        }
        ctx.beeline.addTraceContext({ topic: { name: this._topic.name } });
        return this._topic;
    }
    async start() {
        // The subscribe function returns a long lived AsyncIterable
        // So rather than just having a standard RumbleshipContext
        // we create a 'resetable' context that wraps a real context.
        // the real context is then created on demand, and released on 'reset'.
        // We want this context to have the rights (ACL claims) that the original requester has
        // so we pass in the marshalled ACL that was saved on the original subscribe request
        const onDemandContext = new on_demand_rumbleship_context_1.OnDemandRumbleshipContext(this.marshalled_acl, 
        // if queued we want to share the subscription, otherwise we want unique subscriptons for each instance
        // it is a bit ugly, as we have to use the context to pass this option through the underlying libraries until
        // we ge to the bit that actually makes the subscriptions
        // see 'withQueuedSupport()'
        this.create_unique_subscription ? false : true);
        try {
            const result = await graphql_1.subscribe({
                schema: this.schema,
                document: this.executionContext.query,
                variableValues: this.executionContext.variables,
                operationName: this.executionContext.operationName,
                contextValue: onDemandContext
            });
            const logger = onDemandContext.logger;
            await onDemandContext.reset();
            if ('next' in result) {
                this.activeSubscription = result;
                for await (const executionResult of this.activeSubscription) {
                    // NOTE we are inside a for await
                    await o11y_1.RumbleshipBeeline.runWithoutTrace(async () => {
                        await this.onGqlSubscribeResponse(onDemandContext, executionResult);
                        await onDemandContext.reset();
                    });
                }
                logger.info(`exited QueuedSubscription: ${this.subscription_name} `);
            }
            else {
                const error_payload = { errors: result };
                const error_message = `Error trying to subscribe to: ${this.subscription_name}: ${JSON.stringify(error_payload, undefined, 2)} `;
                onDemandContext.beeline.addTraceContext({
                    'error.name': 'QueuedSubscriptionError',
                    'error.message': 'Error trying to subscribe',
                    'error.subscription_name': this.subscription_name,
                    'error.owner_id': this.owner_id,
                    'error.errors': result
                });
                const error = new Error(error_message);
                throw error;
            }
        }
        finally {
            await onDemandContext.reset();
        }
    }
    async onGqlSubscribeResponse(ctx, executionResult) {
        ctx.beeline.addTraceContext({
            pubsub: {
                projectId: this.googlePublisher.projectId,
                subscription: { name: this.subscription_name },
                topic: { name: this.publish_to_topic_name }
            },
            executionResult
        });
        if (this.publish_to_topic_name.length) {
            try {
                await this.publishResponse(ctx, executionResult);
            }
            catch (error) {
                add_error_to_trace_context_1.addErrorToTraceContext(ctx, error);
                ctx.logger.error(error);
            }
        }
        if (this.onResponseHook) {
            await this.onResponseHook(executionResult);
        }
    }
    async stop() {
        var _a;
        // force the iterator to finish
        if ((_a = this.activeSubscription) === null || _a === void 0 ? void 0 : _a.return) {
            await this.activeSubscription.return();
        }
    }
}
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscription.prototype, "publishResponse", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedSubscription.prototype, "getTopic", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object]),
    __metadata("design:returntype", Promise)
], QueuedSubscription.prototype, "onGqlSubscribeResponse", null);
exports.QueuedSubscription = QueuedSubscription;
//# sourceMappingURL=queued-subscription.js.map