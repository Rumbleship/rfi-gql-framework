import { DocumentNode } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ClassType } from '../../../helpers';
import { QueuedSubscriptionMessage } from '../../servers';
/**
 * QsrObservers are similar to Resolvers, however rahter than doing a class level
 * decorator, we make all QsrObservers derive from this base calss.. this may change in future
 * to match the style of type-graphql...
 */

export const QUEUED_SUBSCRIPTION_OBSERVER_META = Symbol('QueuedSubscriptionObserver');

export interface QueuedSubscriptionObserverMetadata {
  gql_document: DocumentNode | string;
  subscription_name: string;
  operation_name?: string;
  query_attributes?: string;
  active: boolean;
}
export interface QueuedSubscriptionHandler {
  qso_metadata: QueuedSubscriptionObserverMetadata;
  observer_class?: ClassType<Record<string, any>>;
  handler(
    this: Record<string, any>,
    ctx: RumbleshipContext,
    message: QueuedSubscriptionMessage
  ): Promise<void>;
}

export function QSObserver<T>(metadata: QueuedSubscriptionObserverMetadata): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): void {
    // cache all the observers onto the target
    if (descriptor.value && typeof descriptor.value === 'function') {
      const meta = Reflect.getMetadata(QUEUED_SUBSCRIPTION_OBSERVER_META, target) ?? [];
      const handler: QueuedSubscriptionHandler = {
        qso_metadata: metadata,
        handler: descriptor.value
      };
      meta.push(handler);
      Reflect.defineMetadata(QUEUED_SUBSCRIPTION_OBSERVER_META, meta, target);
    }
  };
}

export function getQsoHandlers(
  target: ClassType<Record<string, any>>
): QueuedSubscriptionHandler[] {
  // We need to set the target class here, as it is at this point that the
  // class is fully formed
  const handlers: QueuedSubscriptionHandler[] =
    Reflect.getMetadata(QUEUED_SUBSCRIPTION_OBSERVER_META, target) ??
    Reflect.getMetadata(QUEUED_SUBSCRIPTION_OBSERVER_META, target.prototype) ??
    [];
  handlers.forEach(handler => {
    handler.observer_class = target;
  });
  return handlers;
}
