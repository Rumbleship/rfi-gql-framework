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
exports.QueuedRequestClient = exports.QueuedGqlRequestServer = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
const graphql_1 = require("graphql");
const topic_manifest_constants_1 = require("../../interfaces/topic_manifest_constants");
const rumbleship_context_1 = require("../../../app/rumbleship-context/rumbleship-context");
const helpers_1 = require("../../helpers");
const rfi_pubsub_subscription_1 = require("../../shared/rfi-pubsub-subscription");
const o11y_1 = require("@rumbleship/o11y");
const add_error_to_trace_context_1 = require("../../../app/honeycomb-helpers/add_error_to_trace_context");
/**
 * Complement to the queuedeSubscription service that listens for straight graphql queries and mutations
 * on a GRAPHQL_REQUEST channel and responds to the request over the topic passed in to the request.
 *
 * Note multiple services can respond the the same request. If the request is for an operation that is not supported it is acked to the pubsub engine,
 * but no response is given. If how ever the graphql is malformed, all services may respond.
 *
 * If the response is understood by one or more services, but has some othewr error, then a response will be given.
 *
 *
 * This is an 'inner ring' service that only runs internally to the
 *
 */
class QueuedGqlRequestServer {
    constructor(config, schema) {
        this.config = config;
        this.schema = schema;
        this.request_topic_name = `${config.PubSub.topicPrefix}${topic_manifest_constants_1.QUEUED_GRAPHQL_REQUEST_TOPIC}`;
        this.service_name = config.serviceName;
        // Only one instance of a service should receive and process a request
        this.request_subscription_name = `${this.request_topic_name}_${config.serviceName}`;
        this._pubsub = new pubsub_1.PubSub(config.Gcp.Auth);
        this._pubsub.projectId = this._pubsub.projectId.replace('-private', '-public');
        this._request_subscription = new rfi_pubsub_subscription_1.RfiPubSubSubscription(config, this._pubsub, this.request_topic_name, this.request_subscription_name, false);
    }
    async start(ctx) {
        // this is a long running promise chain that loops listening for messages
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._request_subscription.start(async (ctx, request) => {
            let executionResult;
            ctx.beeline.addTraceContext({ request });
            ctx.beeline.addTraceContext({
                pubsub: { projectId: this._pubsub.projectId },
                config: {
                    Gcp: {
                        Auth: this.config.Gcp.Auth
                    }
                }
            });
            try {
                const executionParams = QueuedGqlRequestServer.validateGqlRequest(this.schema, request);
                executionResult = await graphql_1.execute({
                    schema: this.schema,
                    contextValue: ctx,
                    document: executionParams.query,
                    variableValues: executionParams.variables,
                    operationName: executionParams.operationName
                });
            }
            catch (error) {
                add_error_to_trace_context_1.addErrorToTraceContext(ctx, error, false); // add to context but set 'alert to false as this is expected
                if (request.respond_on_error) {
                    const gqlError = error instanceof graphql_1.GraphQLError
                        ? error
                        : new graphql_1.GraphQLError('error during request execution', undefined, undefined, undefined, undefined, error);
                    if (request.publish_to_topic_name) {
                        await this.publishResponse(ctx, request, { errors: [gqlError] });
                    }
                }
            }
            if (executionResult) {
                ctx.beeline.addTraceContext({ executionResult });
                await this.publishResponse(ctx, request, executionResult);
            }
        });
    }
    async publishResponse(ctx, request, executionResponse) {
        const message = {
            client_request_id: request.client_request_id,
            service_name: this.service_name,
            response: executionResponse
        };
        const topic = await helpers_1.gcpGetTopic(this._pubsub, request.publish_to_topic_name);
        const payload = JSON.stringify(message);
        ctx.beeline.addTraceContext({
            pubsub: {
                projectId: this._pubsub.projectId,
                topic: { name: topic.name },
                config: {
                    Gcp: {
                        Auth: this.config.Gcp.Auth
                    }
                }
            }
        });
        return topic.publish(Buffer.from(payload));
    }
    async stop(ctx) {
        ctx.beeline.addTraceContext({
            pubsub: { projectId: this._pubsub.projectId },
            config: {
                Gcp: {
                    Auth: this.config.Gcp.Auth
                }
            }
        });
        if (this._request_subscription) {
            await this._request_subscription.stop();
        }
    }
    static validateGqlRequest(schema, subscriptionRequest) {
        var _a;
        // parse will throw an error if there are any parse errors
        const gqlDocument = graphql_1.parse((_a = subscriptionRequest.gql_query_string) !== null && _a !== void 0 ? _a : '');
        const executionParams = { query: gqlDocument };
        if (helpers_1.isASubscriptionOperation(gqlDocument, subscriptionRequest.operation_name)) {
            throw new Error('query for subscription must be requesteed via the queuedeSubscriptionServer');
        }
        const errors = graphql_1.validate(schema, gqlDocument, graphql_1.specifiedRules);
        if (errors.length) {
            const errString = JSON.stringify(errors, undefined, 2);
            // todo add explict tracing
            throw new Error(errString);
        }
        if (subscriptionRequest.query_attributes) {
            // will throw if invalid
            executionParams.variables = JSON.parse(subscriptionRequest.query_attributes);
        }
        executionParams.operationName = subscriptionRequest.operation_name;
        return executionParams;
    }
}
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedGqlRequestServer.prototype, "start", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext, Object, Object]),
    __metadata("design:returntype", Promise)
], QueuedGqlRequestServer.prototype, "publishResponse", null);
__decorate([
    o11y_1.AddToTrace(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext]),
    __metadata("design:returntype", Promise)
], QueuedGqlRequestServer.prototype, "stop", null);
exports.QueuedGqlRequestServer = QueuedGqlRequestServer;
class QueuedRequestClient {
}
exports.QueuedRequestClient = QueuedRequestClient;
//# sourceMappingURL=queued_gql_server.js.map