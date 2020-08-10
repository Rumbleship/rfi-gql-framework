"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNodeServicesToContainer = void 0;
const inititialize_queued_subscription_relay_1 = require("../../queued-subscription-server/inititialize_queued_subscription_relay");
function addNodeServicesToContainer(context, container, nodeServices) {
    // Add in any framework defined services...
    const queuedSubscriptionNodeServiceEntry = inititialize_queued_subscription_relay_1.getQueuedSubscriptionRequestNodeServiceEntry(context);
    const mutatedNodeServices = { queuedSubscriptionNodeServiceEntry, ...nodeServices };
    container.set('nodeServices', mutatedNodeServices);
    // also create 'named services' that the framework can inject into the specialized resolvers
    for (const key in mutatedNodeServices) {
        if (nodeServices.hasOwnProperty(key)) {
            const service = nodeServices[key];
            service.setServiceRegister(nodeServices);
            container.set(`${key}Service`, service);
        }
    }
}
exports.addNodeServicesToContainer = addNodeServicesToContainer;
//# sourceMappingURL=add-node-services-to-container.js.map