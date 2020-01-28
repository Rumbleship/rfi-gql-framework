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
exports.googlePubSubOptions = {
    googlePubSubOptions: {
        project: {
            doc: 'Gcloud project name',
            format: 'nonempty-string',
            default: 'the-development-project',
            env: 'GCLOUD_PUBSUB_PROJECT_NAME'
        },
        credentials: {
            username: {
                doc: 'Gcloud (service) account name',
                format: 'nonempty-string',
                default: 'the-pubsub-service-account',
                env: 'GCLOUD_PUBSUB_USERNAME'
            },
            privateKey: {
                doc: 'Gcloud (service) account auth key',
                format: 'nonempty-string',
                default: '-BEGIN-NON-FUNCTIONAL-KEY',
                env: 'GCLOUD_PUBSUB_KEY'
            }
        }
    }
};
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(config) {
        super(config, helper_1.uniqueSubscriptionNamePart);
    }
    // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
    publish(triggerName, payload) {
        return super.publish(triggerName, payload);
    }
    subscribe(triggerName, onMessage, 
    // Upstream definition uses Object but tslint does not like that
    options) {
        return super.subscribe(triggerName, onMessage, options);
    }
    unsubscribe(subId) {
        return super.unsubscribe(subId);
    }
    asyncIterator(triggers) {
        return super.asyncIterator(triggers);
    }
    publishPayload(notificationType, model, deltas) {
        publishing_1.publishPayload(this, notificationType, model, deltas);
    }
}
exports.RfiPubSub = RfiPubSub;
//# sourceMappingURL=index.js.map