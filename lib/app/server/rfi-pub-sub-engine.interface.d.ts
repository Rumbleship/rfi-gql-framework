import { Model } from 'sequelize-typescript';
import { PubSubEngine } from 'type-graphql';
import { NotificationOf, RfiSubscriptionOptions } from '../../gql';
export interface PubEngine extends PubSubEngine {
    publisher_version: string;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribeAll(): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
