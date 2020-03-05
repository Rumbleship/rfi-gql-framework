import { DbModelAndOidScope } from './../db/init-sequelize';
import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { RfiSubscriptionOptions } from './helper';
import { NotificationOf } from '../gql/node-notification';
import { RfiPubSubConfig } from './pub_sub_config';
export interface PubEngine extends PubSubEngine {
    publisher_version: string;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
export declare class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
    protected topicPrefix: string;
    publisher_version: string;
    constructor(publisher_version: string, config: RfiPubSubConfig);
    static validatePubSubConfig(config: RfiPubSubConfig): void;
    publish(triggerName: string, payload: any): Promise<void>;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribe(subId: number): any;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    deleteCurrentSubscriptionsMatchingPrefix(): Promise<void>;
    createSubscriptionsFor(dbModels: DbModelAndOidScope[]): Promise<void>;
    private createTopicIfNotExist;
}
