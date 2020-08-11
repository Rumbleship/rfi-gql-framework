import { ContainerInstance } from 'typedi';
import { NodeService } from '../../gql/relay';
import { RumbleshipContext } from '../rumbleship-context';
import { getFrameworkServices } from './framework_node_services';

export function addNodeServicesToContainer(
  context: RumbleshipContext,
  container: ContainerInstance,
  nodeServices: object
) {
  // Add in any framework defined services...
  const frameworkServices = getFrameworkServices(context);
  const mutatedNodeServices = { ...frameworkServices, ...nodeServices };
  container.set('nodeServices', mutatedNodeServices);
  // also create 'named services' that the framework can inject into the specialized resolvers
  for (const key in mutatedNodeServices) {
    if (nodeServices.hasOwnProperty(key)) {
      const service: NodeService<any> = (nodeServices as any)[key];
      service.setServiceRegister(nodeServices);
      container.set(`${key}Service`, service);
    }
  }
}
