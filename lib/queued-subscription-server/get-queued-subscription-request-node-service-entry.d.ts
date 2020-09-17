import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { NodeService } from '../gql/relay';
/***
 * Helps reduce cyclic dependancies....
 */
export declare function getQueuedSubscriptionRequestNodeServiceEntry(context: RumbleshipContext): {
    [index: string]: NodeService<any>;
};
export declare function getWebhookNodeServiceEntry(context: RumbleshipContext): {
    [index: string]: NodeService<any>;
};
