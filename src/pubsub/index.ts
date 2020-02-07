export * from './helper';
export * from './publishing';
export * from './pub_sub_config';

import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';

import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

import { publishPayload } from './publishing';
import { uniqueSubscriptionNamePart } from './helper';
import { NotificationOf } from '../gql/node-notification';
import { status } from '@grpc/grpc-js';


export interface PubEngine extends PubSubEngine {
  publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
  constructor(config: any) {
    if (config.keyFilename === `/dev/null`) {
      config = {};
    }
    super(config, uniqueSubscriptionNamePart);
  }

  // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
  public async publish(triggerName: string, payload: any): Promise<void> {
    await this.createTopicIfNotExist(triggerName);
    return super.publish(triggerName, payload);
  }

  public async subscribe(
    triggerName: string,
    onMessage: (message: string) => null,
    // Upstream definition uses Object but tslint does not like that
    options?: Object, // tslint:disable-line
  ): Promise<number> {
    await this.createTopicIfNotExist(triggerName);
    return super.subscribe(triggerName, onMessage, options);
  }

  public unsubscribe(subId: number): any {
    return super.unsubscribe(subId);
  }

  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return super.asyncIterator(triggers);
  }

  public publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void {
    // tslint:disable-next-line: no-floating-promises
    publishPayload(this, notificationType, model, deltas);
  }

  private async createTopicIfNotExist(topicName: string): Promise<void> {
    const topics = await this.pubSubClient.getTopics();
    if (topics.indexOf(topicName) < 0) {
      try {
        await this.pubSubClient.createTopic(topicName);
      } catch (e) {
        // tslint:disable-next-line: no-console
        if (!(e.code === status.ALREADY_EXISTS)) {
          // It can be created during a race condition,
          // so only rethrow if it is another error
          throw e;
        }
      }
    }
  }
}
