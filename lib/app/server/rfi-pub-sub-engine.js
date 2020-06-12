"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const P = require("bluebird");
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const grpc_js_1 = require("@grpc/grpc-js");
const os_1 = require("os");
const gql_1 = require("../../gql");
const publish_model_change_1 = require("../../db/service/publish-model-change");
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(publisher_version, config) {
        RfiPubSub.validatePubSubConfig(config);
        const { topicPrefix, keyFilename } = config;
        super(keyFilename === `/dev/null` ? {} : config, gql_1.uniqueSubscriptionNamePart);
        this.topicPrefix = topicPrefix;
        this.publisher_version = publisher_version;
        this.subscription_ids = [];
    }
    static validatePubSubConfig(config) {
        if (['test', 'development'].includes(process.env.NODE_ENV)) {
            if (['test', 'development'].includes(config.topicPrefix)) {
                /**
                 * Each instance of a dev environment (which really means each instance of the database)
                 * e.g. when running locally needs to have a prefix for the topics so they dont clash with others
                 * as we share a development queue in GCP pub sub
                 *
                 * Alternatively, use an emulator!
                 */
                throw new Error('PubSubConfig.topicPrefix MUST be set to a non-clashing value i.e your username.: See @rumbleship/gql: RfiPubSub');
            }
        }
    }
    // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
    async publish(triggerName, payload) {
        const topicName = `${this.topicPrefix}_${triggerName}`;
        await this.createTopicIfNotExist(topicName);
        return super.publish(topicName, payload);
    }
    async subscribe(triggerName, onMessage, options) {
        const topicName = `${this.topicPrefix}_${triggerName}`;
        await this.createTopicIfNotExist(topicName);
        const sub_id = await super.subscribe(topicName, onMessage, options);
        this.subscription_ids.push(sub_id);
        return sub_id;
    }
    unsubscribe(subId) {
        this.subscription_ids = this.subscription_ids.filter(id => id !== subId);
        super.unsubscribe(subId);
    }
    unsubscribeAll() {
        // Googlepub sub supposedly stops polling for events when there are no more listeners
        for (const id of this.subscription_ids) {
            super.unsubscribe(id);
        }
        this.subscription_ids = [];
    }
    asyncIterator(triggers) {
        return super.asyncIterator(triggers);
    }
    publishPayload(notificationType, model, deltas) {
        // tslint:disable-next-line: no-floating-promises
        publish_model_change_1.publishModelChange(this, notificationType, model, deltas);
    }
    async deleteCurrentSubscriptionsMatchingPrefix() {
        const [subscriptions] = await this.pubSubClient.getSubscriptions();
        const mySubscriptions = subscriptions.filter((s) => s.name.match(new RegExp(`${this.topicPrefix}`)));
        await P.map(mySubscriptions, async (subscription) => {
            const { name } = subscription;
            await this.pubSubClient.subscription(name).delete();
        });
    }
    async createSubscriptionsFor(dbModels) {
        await P.map(dbModels, async ({ scope }) => {
            const triggerName = `${this.topicPrefix}_NODE_CHANGE_NOTIFICATION_${scope}`;
            await this.createTopicIfNotExist(triggerName);
            await this.pubSubClient.topic(triggerName).createSubscription(triggerName + `-${os_1.hostname()}`);
        });
    }
    async createTopicIfNotExist(topicName) {
        const topic = this.pubSubClient.topic(topicName);
        const [exists] = await topic.exists();
        if (!exists) {
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
//# sourceMappingURL=rfi-pub-sub-engine.js.map