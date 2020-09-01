import { RumbleshipContext } from '../rumbleship-context';
import { Node, NodeService } from '../../gql/relay/relay.interface';
export declare function getFrameworkServices(context: RumbleshipContext): Record<string, any>;
export declare function addFrameworkServiceFactory(aNodeServiceFactory: (context: RumbleshipContext) => {
    [x: string]: NodeService<Node<any>>;
}): void;
