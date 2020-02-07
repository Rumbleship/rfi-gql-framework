import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';
import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';
import { NotificationOf } from '../gql/node-notification';
import { RfiPubSubConfig } from './pub_sub_config';
export interface PubEngine extends PubSubEngine {
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
export declare class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
    protected topicPrefix: string;
    constructor(config: RfiPubSubConfig);
    static validatePubSubConfig(config: RfiPubSubConfig): void;
    publish(triggerName: string, payload: any): Promise<void>;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: Object): Promise<number>;
    unsubscribe(subId: number): any;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    private createTopicIfNotExist;
}
