"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFrameworkServiceFactory = exports.getFrameworkServices = void 0;
const _frameworkNodeServiceFactories = [];
function getFrameworkServices(context) {
    const frameworkNodeServiceInstance = _frameworkNodeServiceFactories.map(aFact => aFact(context));
    const merged = Object.assign({}, ...frameworkNodeServiceInstance);
    return merged;
}
exports.getFrameworkServices = getFrameworkServices;
function addFrameworkServiceFactory(aNodeServiceFactory) {
    _frameworkNodeServiceFactories.push(aNodeServiceFactory);
}
exports.addFrameworkServiceFactory = addFrameworkServiceFactory;
//# sourceMappingURL=framework_node_services.js.map