import { RumbleshipContext } from '../rumbleship-context';
import { NodeService } from '../../gql/relay/relay.interface';
export declare function getFrameworkServices(context: RumbleshipContext): object;
export declare function addFrameworkServiceFactory(aNodeServiceFactory: (context: RumbleshipContext) => {
    [x: string]: NodeService<any>;
}): void;
