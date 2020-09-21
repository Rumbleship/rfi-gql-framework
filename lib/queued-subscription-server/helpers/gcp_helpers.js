"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gcpCreatePushSubscription = exports.gcpGetTopic = void 0;
async function gcpGetTopic(pubsub, topic_name) {
    let topic = pubsub.topic(topic_name);
    const [exists] = await topic.exists();
    if (!exists) {
        try {
            [topic] = await pubsub.createTopic(topic_name);
        }
        catch (e) {
            const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
            if (e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
                // It can be created during a race condition,
                // so try again
                topic = pubsub.topic(topic_name);
            }
            else {
                throw e;
            }
        }
    }
    return topic;
}
exports.gcpGetTopic = gcpGetTopic;
async function gcpCreatePushSubscription(topic, subscription_name, subscription_url, service_account_email = 'pubsub-invoker@rfi-development.iam.gserviceaccount.com') {
    const options = {
        pushConfig: {
            // Set to an HTTPS endpoint of your choice. If necessary, register
            // (authorize) the domain on which the server is hosted.
            pushEndpoint: subscription_url,
            oidcToken: { serviceAccountEmail: service_account_email }
        }
    };
    const [subscription] = await topic.createSubscription(subscription_name, options);
    return subscription;
}
exports.gcpCreatePushSubscription = gcpCreatePushSubscription;
//# sourceMappingURL=gcp_helpers.js.map