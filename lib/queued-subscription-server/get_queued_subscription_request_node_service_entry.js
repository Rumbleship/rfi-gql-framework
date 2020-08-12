"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueuedSubscriptionRequestNodeServiceEntry = void 0;
const inititialize_queued_subscription_relay_1 = require("./inititialize_queued_subscription_relay");
const queued_subscription_request_service_1 = require("./queued_subscription_request/db/queued_subscription_request.service");
/***
 * Helps reduce cyclic dependancies....
 */
function getQueuedSubscriptionRequestNodeServiceEntry(context) {
    return {
        [inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName()]: new queued_subscription_request_service_1.QueuedSubscriptionRequestServiceSequelize(context)
    };
}
exports.getQueuedSubscriptionRequestNodeServiceEntry = getQueuedSubscriptionRequestNodeServiceEntry;
//# sourceMappingURL=get_queued_subscription_request_node_service_entry.js.map