"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNodeServicesToContainer = void 0;
const framework_node_services_1 = require("./framework_node_services");
function addNodeServicesToContainer(context, container, nodeServices) {
    // Add in any framework defined services...
    const frameworkServices = framework_node_services_1.getFrameworkServices(context);
    const mutatedNodeServices = { frameworkServices, ...nodeServices };
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