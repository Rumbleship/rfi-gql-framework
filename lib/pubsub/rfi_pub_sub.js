"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const publishing_1 = require("./publishing");
const helper_1 = require("./helper");
const grpc_js_1 = require("@grpc/grpc-js");
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(config) {
        RfiPubSub.validatePubSubConfig(config);
        if (config.keyFilename === `/dev/null`) {
            config = {};
        }
        super(config, helper_1.uniqueSubscriptionNamePart);
        this.topicPrefix = config.topicPrefex;
    }
    static validatePubSubConfig(config) {
        if (['test', 'development'].includes(process.env.NODE_ENV)) {
            if (['test', 'development'].includes(config.topicPrefex)) {
                /**
                 * Each instance of a dev environment (which really means each instance of the database)
                 * e.g. when running locally needs to have a prefix for the topics so they dont clash with others
                 * as we share a development queue in GCP pub sub
                 *
                 * Alternatively, use an emulator!
                 */
                throw new Error('PubSubConfig.topicPrefix MUST be set to a non-clashing value i.e your username');
            }
        }
    }
    // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
    async publish(triggerName, payload) {
        triggerName = `${this.topicPrefix}/${triggerName}`;
        await this.createTopicIfNotExist(triggerName);
        return super.publish(triggerName, payload);
    }
    async subscribe(triggerName, onMessage, 
    // Upstream definition uses Object but tslint does not like that
    // tslint:disable-next-line: ban-types
    options) {
        triggerName = `${this.topicPrefix}/${triggerName}`;
        await this.createTopicIfNotExist(triggerName);
        return super.subscribe(triggerName, onMessage, options);
    }
    unsubscribe(subId) {
        return super.unsubscribe(subId);
    }
    asyncIterator(triggers) {
        return super.asyncIterator(triggers);
    }
    publishPayload(notificationType, model, deltas) {
        // tslint:disable-next-line: no-floating-promises
        publishing_1.publishPayload(this, notificationType, model, deltas);
    }
    async createTopicIfNotExist(topicName) {
        const topics = await this.pubSubClient.getTopics();
        if (topics.indexOf(topicName) < 0) {
            try {
                await this.pubSubClient.createTopic(topicName);
            }
            catch (e) {
                if (!(e.code === grpc_js_1.status.ALREADY_EXISTS)) {
                    // It can be created during a race condition,
                    // so only rethrow if it is another error
                    throw e;
                }
            }
        }
    }
}
exports.RfiPubSub = RfiPubSub;
//# sourceMappingURL=rfi_pub_sub.js.map