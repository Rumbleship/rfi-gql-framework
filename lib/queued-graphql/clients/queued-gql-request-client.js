"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedGqlRequestClientOneInstanceResponder = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
const helpers_1 = require("../helpers");
const topic_manifest_constants_1 = require("../interfaces/topic_manifest_constants");
const rfi_pubsub_subscription_1 = require("../shared/rfi-pubsub-subscription");
/**
 * Creates a client to send and listen for reposnes over the 'queue (eg google pubsub)
 *
 * This can be a bit subtle, and there are differnet Clients for different use-cases:
 *
    class QueuedGqlRequestClientOneInstanceResponder a request is sent out by one instance, and any one instance of the app
    will receive the response.

      This is useful when the code to make a request is disconnected from the response and the responding code can eitehr get
      context via a persistent state in the shared database, or it can respond effectively without knowing the specific request details.

      The subscription that is created in this case is tied to the service name, not a specific instance, so if the service is not running when the
      response sent, the pubsub infra will wait till it is up before delivering.

      THis makes for a robust service to service communication, as the the service that the request is being made to can be not present
      when the request is made as well

      Some care is in order when cosidering promotion of versions as a request may of been made and a new vedrsion of the app is loaded
      before the response is received...

      A handler is set for each 'client_request_id' and will be typically the
 *
 */
class QueuedGqlRequestClientOneInstanceResponder {
    constructor(config) {
        this.config = config;
        this._client_id_handler_map = new Map();
        // this is a 'global' topic that all services who can respond to a graphql request listens to
        this.request_topic_name = `${config.PubSub.topicPrefix}${topic_manifest_constants_1.QUEUED_GRAPHQL_REQUEST_TOPIC}`;
        this.service_name = config.serviceName;
        // we have a topic defined for each service for responses to be published to
        this.response_topic_name = `${config.PubSub.topicPrefix}${topic_manifest_constants_1.QUEUED_GRAPHQL_RESPONSE_TOPIC}_${this.service_name}`;
        // And a single subscription for each service to listen to that topic
        this.response_subscription_name = `${this.response_topic_name}`;
        this._pubsub = new pubsub_1.PubSub(config.Gcp.Auth);
        this._response_subscription = new rfi_pubsub_subscription_1.RfiPubSubSubscription(config, this._pubsub, this.response_topic_name, this.response_subscription_name);
    }
    async makeRequest(ctx, params) {
        const request = {
            ...params,
            publish_to_topic_name: this.response_topic_name,
            marshalled_acl: ctx.authorizer.marshalClaims(),
            owner_id: ctx.authorizer.getUser()
        };
        const topic = await helpers_1.gcpGetTopic(this._pubsub, this.request_topic_name);
        const payload = JSON.stringify(request);
        return topic.publish(Buffer.from(payload));
    }
    async start() {
        await this._response_subscription.init();
        await this._response_subscription.start(async (ctx, response) => {
            const handler = this._client_id_handler_map.get(response.client_request_id);
            if (handler) {
                return handler(ctx, response);
            }
        }, this.constructor.name);
    }
    async stop() {
        return this._response_subscription.stop();
    }
    onResponse(params) {
        this._client_id_handler_map.set(params.client_request_id, params.handler);
    }
    stopResponding(params) {
        this._client_id_handler_map.delete(params.client_request_id);
    }
}
exports.QueuedGqlRequestClientOneInstanceResponder = QueuedGqlRequestClientOneInstanceResponder;
//# sourceMappingURL=queued-gql-request-client.js.map