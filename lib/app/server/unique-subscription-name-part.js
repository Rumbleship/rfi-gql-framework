"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueSubscriptionNamePart = void 0;
const os_1 = require("os");
function uniqueSubscriptionNamePart(topicName, subscriptionOptions) {
    var _a;
    if (subscriptionOptions && subscriptionOptions.asService) {
        return `${topicName}-${(_a = subscriptionOptions.serviceName) !== null && _a !== void 0 ? _a : 'any'}-ServiceSubscription`;
    }
    else {
        return `${topicName}-${os_1.hostname()}`;
    }
}
exports.uniqueSubscriptionNamePart = uniqueSubscriptionNamePart;
//# sourceMappingURL=unique-subscription-name-part.js.map