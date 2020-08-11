import { RumbleshipContext } from '../rumbleship-context';
import { NodeService } from '../../gql/relay/relay.interface';

const _frameworkNodeServiceFactories: Array<(
  context: RumbleshipContext
) => { [x: string]: NodeService<any> }> = [];
export function getFrameworkServices(context: RumbleshipContext): object {
  const frameworkNodeServiceInstance = _frameworkNodeServiceFactories.map(aFact => aFact(context));
  const merged = Object.assign({}, ...frameworkNodeServiceInstance);
  return merged;
}

export function addFrameworkServiceFactory(
  aNodeServiceFactory: (context: RumbleshipContext) => { [x: string]: NodeService<any> }
) {
  _frameworkNodeServiceFactories.push(aNodeServiceFactory);
}
