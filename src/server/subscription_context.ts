import { ConnectionContext } from 'subscriptions-transport-ws';
import { Authorizer, InvalidJWTError } from '@rumbleship/acl';
import { RumbleshipContext } from './rumbleship-context';
import { ClassType } from '../helpers';

export function initializeSubscriptionContext(
  connectionParams: object /** the params passed by the initial websoctect connection request */,
  _webSocket: any /* is ws.WebSocket, but right now is not used*/,
  context: ConnectionContext /** the context passed in by apollo */,
  injected: {
    accessTokenSecret: string;
    authenticationErrorClass: ClassType<Error>;
    rumbleshipContextFactory: ClassType<RumbleshipContext>;
    config: object; // the global convict configuration object
  }
): ConnectionContext {
  const bearer_token =
    (connectionParams as any).Authorization || (connectionParams as any).authorization;
  if (bearer_token) {
    const authorizer = (() => {
      try {
        return new Authorizer(bearer_token, injected.accessTokenSecret);
      } catch (error) {
        if (error instanceof InvalidJWTError) {
          throw new injected.authenticationErrorClass(error.message);
        }
        throw error;
      }
    })();

    try {
      authorizer.authenticate();
    } catch (e) {
      throw new injected.authenticationErrorClass(e.message);
    }
    const rumbleship_context = injected.rumbleshipContextFactory.make(__filename, {
      authorizer,
      config: injected.config,
      initial_trace_metadata: {
        subscription: true
      }
    });
    rumbleship_context.trace = rumbleship_context.beeline.startTrace({
      name: 'subscription'
    });
    (context as any).rumbleship_context = rumbleship_context;
    return context;
  }
  throw new injected.authenticationErrorClass('Access Token Required');
}

export function releaseSubscriptionContext(_webSocket: any, context: ConnectionContext) {
  const { rumbleship_context } = context as any;
  if (rumbleship_context) {
    setImmediate(() => (rumbleship_context as RumbleshipContext).release());
  }
}
