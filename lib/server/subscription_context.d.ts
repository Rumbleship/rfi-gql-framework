import { ConnectionContext } from 'subscriptions-transport-ws';
import { RumbleshipContext } from './rumbleship-context';
export declare function initializeSubscriptionContext(connectionParams: object /** the params passed by the initial websoctect connection request */, _webSocket: any, context: ConnectionContext /** the context passed in by apollo */, injected: {
    accessTokenSecret: string;
    authenticationErrorClass: typeof Error;
    rumbleshipContextFactory: typeof RumbleshipContext;
    config: object;
}): ConnectionContext;
export declare function releaseSubscriptionContext(_webSocket: any, context: ConnectionContext): void;
