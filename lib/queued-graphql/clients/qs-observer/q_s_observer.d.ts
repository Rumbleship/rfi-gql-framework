import { DocumentNode } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ClassType } from '../../../helpers';
import { QueuedSubscriptionMessage } from '../../servers';
/**
 * QsrObservers are similar to Resolvers, however rahter than doing a class level
 * decorator, we make all QsrObservers derive from this base calss.. this may change in future
 * to match the style of type-graphql...
 */
export declare const QUEUED_SUBSCRIPTION_OBSERVER_META: unique symbol;
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
    handler(this: Record<string, any>, ctx: RumbleshipContext, message: QueuedSubscriptionMessage): Promise<void>;
}
export declare function QSObserver<T>(metadata: QueuedSubscriptionObserverMetadata): MethodDecorator;
export declare function getQsoHandlers(target: ClassType<Record<string, any>>): QueuedSubscriptionHandler[];
