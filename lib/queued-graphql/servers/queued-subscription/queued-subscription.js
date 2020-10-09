"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedSubscription = void 0;
const graphql_1 = require("graphql");
const on_demand_rumbleship_context_1 = require("../../../app/rumbleship-context/on-demand-rumbleship-context");
const is_subscription_operation_1 = require("../../helpers/is-subscription-operation");
const pubsub_1 = require("@google-cloud/pubsub");
const gcp_helpers_1 = require("../../helpers/gcp_helpers");
class QueuedSubscription {
    /**
     * Throws errors if the subscriptionRequest is not valid
     * @param schema
     * @param subscriptionRequest
     * @param publishToTopicName
     * @param pesistent_id
     */
    constructor(schema, subscriptionRequest, config, googlePublisher = new pubsub_1.PubSub(config.Auth)) {
        this.schema = schema;
        this.googlePublisher = googlePublisher;
        // This object is a very longlived 'active' object, so we dont want to have
        // any unexpected side-effects of holding relay objects in memory and the
        // potential for large networks of objects and services never being garbage collected
        //
        //
        let id;
        ({
            owner_id: this.owner_id,
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
    /**
     * publishes repsononses to the QueuedSubscriptionRequest
     */
    async publishResponse(response) {
        var _a, _b;
        const subscription_name = (_a = this.subscription_name) !== null && _a !== void 0 ? _a : '';
        const message = {
            owner_id: (_b = this.owner_id) !== null && _b !== void 0 ? _b : '',
            subscription_name,
            subscription_id: this.id.toString(),
            subscription_response: response
        };
        const topic = await this.getTopic();
        const payload = JSON.stringify(message);
        return topic.publish(Buffer.from(payload));
    }
    async getTopic() {
        if (!this._topic) {
            this._topic = await gcp_helpers_1.gcpGetTopic(this.googlePublisher, this.publish_to_topic_name);
        }
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
            if ('next' in result) {
                this.activeSubscription = result;
                for await (const executionResult of this.activeSubscription) {
                    logger.info(`contextid: ${onDemandContext.id}: Ready to send Subscription response for ${this.subscription_name} to ${this.publish_to_topic_name}: 
        ${JSON.stringify(executionResult, undefined, 2)}`);
                    if (this.publish_to_topic_name.length) {
                        await this.publishResponse(executionResult);
                    }
                    if (this.onResponseHook) {
                        await this.onResponseHook(executionResult);
                    }
                    await onDemandContext.reset();
                }
                logger.info(`exited QueuedSubscription: ${this.subscription_name} `);
            }
            else {
                const error_payload = { errors: result };
                const error_message = `Error trying to subscribe to: ${this.subscription_name}: ${JSON.stringify(error_payload, undefined, 2)} `;
                logger.error(error_message);
                throw new Error(error_message);
            }
        }
        finally {
            await onDemandContext.reset();
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
exports.QueuedSubscription = QueuedSubscription;
//# sourceMappingURL=queued-subscription.js.map