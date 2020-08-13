"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueuedSubscriptionRequestDbModelAndOidScope = void 0;
const queued_subscription_request_model_1 = require("../db/queued-subscription-request.model");
const inititialize_queued_subscription_relay_1 = require("../../inititialize-queued-subscription-relay");
const queuedSubscriptionRequestModels = [
    {
        scope: inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestScopeName(),
        dbModel: queued_subscription_request_model_1.QueuedSubscriptionRequestModel
    }
];
function getQueuedSubscriptionRequestDbModelAndOidScope() {
    return queuedSubscriptionRequestModels;
}
exports.getQueuedSubscriptionRequestDbModelAndOidScope = getQueuedSubscriptionRequestDbModelAndOidScope;
//# sourceMappingURL=queued-subscription-request-models.js.map