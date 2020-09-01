import { RumbleshipContext } from '../rumbleship-context';
import { Node, NodeService } from '../../gql/relay/relay.interface';

const _frameworkNodeServiceFactories: Array<(
  context: RumbleshipContext
) => { [x: string]: NodeService<any> }> = [];
export function getFrameworkServices(context: RumbleshipContext): Record<string, any> {
  const frameworkNodeServiceInstance = _frameworkNodeServiceFactories.map(aFactory =>
    aFactory(context)
  );
  const merged = Object.assign({}, ...frameworkNodeServiceInstance);
  return merged;
}

export function addFrameworkServiceFactory(
  aNodeServiceFactory: (context: RumbleshipContext) => { [x: string]: NodeService<Node<any>> }
): void {
  _frameworkNodeServiceFactories.push(aNodeServiceFactory);
}
