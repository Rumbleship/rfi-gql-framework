import { ContainerInstance } from 'typedi';
import { NodeService, Node } from '../../gql/relay';
import { RumbleshipContext } from '../rumbleship-context';
import { getFrameworkServices } from './framework-node-services';

export function addNodeServicesToContainer(
  context: RumbleshipContext,
  container: ContainerInstance,
  nodeServices: NodeServiceMap<string>
): void {
  // Add in any framework defined services...
  const frameworkServices = getFrameworkServices(context);
  const mutatedNodeServices = { ...frameworkServices, ...nodeServices };
  container.set('nodeServices', mutatedNodeServices);
  // also create 'named services' that the framework can inject into the specialized resolvers
  for (const key in mutatedNodeServices) {
    if (mutatedNodeServices.hasOwnProperty(key)) {
      const service: NodeService<any> = (mutatedNodeServices as any)[key];
      service.setServiceRegister(mutatedNodeServices);
      container.set(`${key}Service`, service);
    }
  }
}

export type NodeServiceMap<TServiceName extends string = string> = Record<
  TServiceName,
  NodeService<Node<unknown>>
>;
