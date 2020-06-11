import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { NotificationOf, RfiSubscriptionOptions } from '../../gql';
import { RfiPubSubConfig } from '../config';
import { DbModelAndOidScope } from './init-sequelize';
export interface PubEngine extends PubSubEngine {
    publisher_version: string;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribeAll(): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
export declare class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
    protected topicPrefix: string;
    publisher_version: string;
    protected subscription_ids: number[];
    constructor(publisher_version: string, config: RfiPubSubConfig);
    static validatePubSubConfig(config: RfiPubSubConfig): void;
    publish(triggerName: string, payload: any): Promise<void>;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribe(subId: number): void;
    unsubscribeAll(): void;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    deleteCurrentSubscriptionsMatchingPrefix(): Promise<void>;
    createSubscriptionsFor(dbModels: DbModelAndOidScope[]): Promise<void>;
    private createTopicIfNotExist;
}
