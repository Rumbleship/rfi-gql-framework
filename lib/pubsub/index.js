"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./helper"));
__export(require("./publishing"));
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const publishing_1 = require("./publishing");
const helper_1 = require("./helper");
exports.GCPPubSub = {
    projectId: {
        doc: 'Gcp project name',
        format: String,
        default: 'the-development-project',
        env: 'GCP_PUBSUB_PROJECT_NAME'
    },
    client_email: {
        doc: 'Gcp (service) account name',
        format: 'nonempty-string',
        default: 'pubsub-rw-svc-acct@rfi-devel-project.iam.gserviceaccount.com',
        env: 'GCP_PUBSUB_USERNAME'
    },
    private_key: {
        doc: 'Gcp (service) account auth key',
        format: 'nonempty-string',
        default: '-BEGIN-NON-FUNCTIONAL-KEY',
        env: 'GCP_PUBSUB_KEY'
    }
};
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(config) {
        super(config, helper_1.uniqueSubscriptionNamePart);
    }
    // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
    async publish(triggerName, payload) {
        await this.createTopicIfNotExist(triggerName);
        return super.publish(triggerName, payload);
    }
    async subscribe(triggerName, onMessage, 
    // Upstream definition uses Object but tslint does not like that
    options) {
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
            await this.pubSubClient.createTopic(topicName);
        }
    }
}
exports.RfiPubSub = RfiPubSub;
//# sourceMappingURL=index.js.map