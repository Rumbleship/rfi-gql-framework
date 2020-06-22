import { Model } from 'sequelize-typescript';
import { PubSubEngine } from 'type-graphql';
import { ModelDelta } from './../../gql/relay/node-notification';
import { NotificationOf, RfiSubscriptionOptions } from '../../gql';
export interface PubEngine extends PubSubEngine {
    publisher_version: string;
    getMarshalledTraceContext(trace_id: string): string;
    publishModelChange(notificationType: NotificationOf, model: Model, deltas: any[]): void;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribeAll(): void;
}
export declare type RfiPubSubEngine = PubEngine & PubSubEngine;
export interface Payload {
    publisher_version: string;
    oid: string;
    id: string;
    action: string;
    deltas: ModelDelta[];
    marshalled_trace?: string;
}