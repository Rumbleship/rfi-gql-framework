import { ISharedSchema } from '@rumbleship/config';
import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../app/rumbleship-context';
import { ClassType } from '../helpers';
import { Container } from 'typedi';
import { QueuedSubscriptionObserver, QueuedSubscriptionObserverManager } from './clients';
import { QueuedGqlRequestServer, QueuedSubscriptionServer } from './servers';
export function initQueuedGraphql(
  config: ISharedSchema,
  schema: GraphQLSchema,
  observers: ClassType<QueuedSubscriptionObserver>[]
): void {
  // We set these objects to the container as they can be referenced in client apps
  // and we want to reduce the dependancies
  const queuedSubscriptionServer = new QueuedSubscriptionServer(config, schema);
  Container.set('theQueuedSubscriptionServer', queuedSubscriptionServer);
  const queuedGqlRequestServer = new QueuedGqlRequestServer(config, schema);
  Container.set('theQueuedGqlRequestServer', queuedGqlRequestServer);
  if (observers.length) {
    const queuedSubscriptionObservers = new QueuedSubscriptionObserverManager(config, observers);
    Container.set('theQueuedSubscriptionObserverManager', queuedSubscriptionObservers);
  }
}

export async function startQueuedGraphQl(ctx: RumbleshipContext): Promise<void> {
  // all the starts kick off there own promise chains...
  // we must await each of them to correctly manage the ctx... As this ctx is JUST for
  // startup and tracing
  const qsrSubscriptionServer: QueuedSubscriptionServer = Container.get(
    'theQueuedSubscriptionServer'
  );
  await qsrSubscriptionServer.start(ctx);
  const qsrRequestServer: QueuedGqlRequestServer = Container.get('theQueuedGqlRequestServer');
  await qsrRequestServer.start(ctx);
  const qsoManager: QueuedSubscriptionObserverManager | undefined = Container.get(
    'theQueuedSubscriptionObserverManager'
  );

  if (qsoManager) {
    await qsoManager.init(ctx);
    await qsoManager.start(ctx);
  }
}

export async function stopQueuedGraphQl(ctx: RumbleshipContext): Promise<void> {
  const qsrSubscriptionServer: QueuedSubscriptionServer = Container.get(
    'theQueuedSubscriptionServer'
  );
  await qsrSubscriptionServer.stop(ctx);
  const qsrRequestServer: QueuedGqlRequestServer = Container.get('theQueuedGqlRequestServer');
  await qsrRequestServer.stop(ctx);
  const qsoManager: QueuedSubscriptionObserverManager | undefined = Container.get(
    'theQueuedSubscriptionObserverManager'
  );
  if (qsoManager) {
    await qsoManager.stop(ctx);
  }
}
