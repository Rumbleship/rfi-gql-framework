import { ContainerInstance } from 'typedi';
import { NodeService } from '../../gql/relay';
import { RumbleshipContext } from '../rumbleship-context';
import { getQueuedSubscriptionRequestNodeServiceEntry } from '../../queued-subscription-server/inititialize_queued_subscription_relay';
export function addNodeServicesToContainer(
  context: RumbleshipContext,
  container: ContainerInstance,
  nodeServices: object
) {
  // Add in any framework defined services...
  const queuedSubscriptionNodeServiceEntry = getQueuedSubscriptionRequestNodeServiceEntry(context);
  const mutatedNodeServices = { queuedSubscriptionNodeServiceEntry, ...nodeServices };
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
