export * from './helper';
import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize';
import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';
import { NotificationOf } from '../gql/node-notification';
export declare const googlePubSubOptions: {
    googlePubSubOptions: {
        project: {
            doc: string;
            format: string;
            default: string;
            env: string;
        };
        credentials: {
            username: {
                doc: string;
                format: string;
                default: string;
                env: string;
            };
            privateKey: {
                doc: string;
                format: string;
                default: string;
                env: string;
            };
        };
    };
};
export interface PubEngine extends PubSubEngine {
    publishPayload(notificationType: NotificationOf, model: Model, deltas: Array<any>): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
export declare class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
    constructor(config: any);
    publish(triggerName: string, payload: any): Promise<void>;
    subscribe(triggerName: string, onMessage: Function, options: Object): Promise<number>;
    unsubscribe(subId: number): any;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    publishPayload(notificationType: NotificationOf, model: Model, deltas: Array<any>): void;
}
