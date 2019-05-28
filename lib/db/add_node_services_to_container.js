"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addNodeServicesToContainer(container, nodeServices) {
    container.set('nodeServices', nodeServices);
    // also create 'named services' that the framework can inject into the specialized resolvers
    for (const key in nodeServices) {
        if (nodeServices.hasOwnProperty(key)) {
            const service = nodeServices[key];
            service.setServiceRegister(nodeServices);
            container.set(`${key}Service`, service);
        }
    }
}
exports.addNodeServicesToContainer = addNodeServicesToContainer;
//# sourceMappingURL=add_node_services_to_container.js.map