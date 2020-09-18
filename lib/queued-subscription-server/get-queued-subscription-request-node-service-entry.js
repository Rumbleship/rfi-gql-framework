"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhookNodeServiceEntry = exports.getQueuedSubscriptionRequestNodeServiceEntry = void 0;
const inititialize_queued_subscription_relay_1 = require("./inititialize-queued-subscription-relay");
const queued_subscription_request_service_1 = require("./queued_subscription_request/db/queued-subscription-request.service");
const webhook_1 = require("./webhook");
/***
 * Helps reduce cyclic dependancies....
 */
function getQueuedSubscriptionRequestNodeServiceEntry(context) {
    return {
        [inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()]: new queued_subscription_request_service_1.QueuedSubscriptionRequestServiceSequelize(context)
    };
}
exports.getQueuedSubscriptionRequestNodeServiceEntry = getQueuedSubscriptionRequestNodeServiceEntry;
function getWebhookNodeServiceEntry(context) {
    return {
        [inititialize_queued_subscription_relay_1.getWebhookScopeName()]: new webhook_1.WebhookServiceSequelize(context)
    };
}
exports.getWebhookNodeServiceEntry = getWebhookNodeServiceEntry;
//# sourceMappingURL=get-queued-subscription-request-node-service-entry.js.map