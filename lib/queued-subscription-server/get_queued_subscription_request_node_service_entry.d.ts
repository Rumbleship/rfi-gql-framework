import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { NodeService } from '../gql/relay';
/***
 * Helps reduce cyclic dependancies....
 */
export declare function getQueuedSubscriptionRequestNodeServiceEntry(context: RumbleshipContext): {
    [x: string]: NodeService<any>;
};
