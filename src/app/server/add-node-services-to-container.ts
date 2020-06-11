import { ContainerInstance } from 'typedi';
import { NodeService } from '../../gql';

export function addNodeServicesToContainer(container: ContainerInstance, nodeServices: object) {
  container.set('nodeServices', nodeServices);
  // also create 'named services' that the framework can inject into the specialized resolvers
  for (const key in nodeServices) {
    if (nodeServices.hasOwnProperty(key)) {
      const service: NodeService<any> = (nodeServices as any)[key];
      service.setServiceRegister(nodeServices);
      container.set(`${key}Service`, service);
    }
  }
}
