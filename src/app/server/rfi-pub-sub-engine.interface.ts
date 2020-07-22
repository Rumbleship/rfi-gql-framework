import { Model } from 'sequelize-typescript';
import { PubSubEngine } from 'type-graphql';
import { ModelDelta } from './../../gql/relay/node-notification';
import { NotificationOf, RfiSubscriptionOptions } from '../../gql';
export interface PubEngine extends PubSubEngine {
  publisher_version: string;
  getMarshalledTraceContext(trace_id: string): string;
  publishModelChange(notificationType: NotificationOf, model: Model, deltas: any[]): void;
  subscribe(
    triggerName: string,
    onMessage: (message: string) => null,
    options?: RfiSubscriptionOptions
  ): Promise<number>;
  unsubscribeAll(): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export enum PayloadTypes {
  NODE_CHANGE = 'NODE_CHANGE',
  SUBSCRIPTION_COMMAND = 'SUBSCRIPTION_COMMAND'
}

/**
 * @note `type` is optional because not all payloads coming in are guaranteed to have it
 * until we release this code.
 * @chore to make `type` required: https://www.pivotaltracker.com/story/show/173474911
 */
export interface Payload<T extends PayloadTypes> {
  marshalled_trace?: string;
  authorized_user?: string;
  type?: T;
}
export interface NodeChangePayload extends Payload<PayloadTypes.NODE_CHANGE> {
  publisher_version: string;
  oid: string;
  id: string;
  action: string;
  deltas: ModelDelta[];
}

export interface SubscriptionCommandPayload extends Payload<PayloadTypes.SUBSCRIPTION_COMMAND> {
  command: SubscriptionCommand;
  google_app_version: string;
}

export enum SubscriptionCommand {
  SUBSCRIPTION_START_VERSION = 'SUBSCRIPTION_START_VERSION',
  SUBSCRIPTION_STOP_VERSION = 'SUBSCRIPTION_STOP_VERSION',
  SUBSCRIPTION_RUN_VERSION = 'SUBSCRIPTION_RUN_VERSION'
}
