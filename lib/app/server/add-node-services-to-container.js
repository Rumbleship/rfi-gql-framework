"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNodeServicesToContainer = void 0;
const framework_node_services_1 = require("./framework-node-services");
function addNodeServicesToContainer(context, container, nodeServices) {
    // Add in any framework defined services...
    const frameworkServices = framework_node_services_1.getFrameworkServices(context);
    const mutatedNodeServices = { ...frameworkServices, ...nodeServices };
    container.set('nodeServices', mutatedNodeServices);
    // also create 'named services' that the framework can inject into the specialized resolvers
    for (const key in mutatedNodeServices) {
        // eslint-disable-next-line no-prototype-builtins
        if (mutatedNodeServices.hasOwnProperty(key)) {
            const service = mutatedNodeServices[key];
            service.setServiceRegister(mutatedNodeServices);
            container.set(`${key}Service`, service);
        }
    }
}
exports.addNodeServicesToContainer = addNodeServicesToContainer;
//# sourceMappingURL=add-node-services-to-container.js.map