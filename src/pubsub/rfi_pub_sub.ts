import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';

import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

import { publishPayload } from './publishing';
import { uniqueSubscriptionNamePart } from './helper';
import { NotificationOf } from '../gql/node-notification';
import { status } from '@grpc/grpc-js';
import { RfiPubSubConfig } from './pub_sub_config';

export interface PubEngine extends PubSubEngine {
  publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
  protected topicPrefix: string;
  constructor(config: RfiPubSubConfig) {
    RfiPubSub.validatePubSubConfig(config);
    const { topicPrefix } = config;
    if (config.keyFilename === `/dev/null`) {
      config = {} as any;
    }
    super(config, uniqueSubscriptionNamePart);
    this.topicPrefix = topicPrefix;
  }

  static validatePubSubConfig(config: RfiPubSubConfig) {
    if (['test', 'development'].includes(process.env.NODE_ENV as string)) {
      if (['test', 'development'].includes(config.topicPrefix)) {
        /**
         * Each instance of a dev environment (which really means each instance of the database)
         * e.g. when running locally needs to have a prefix for the topics so they dont clash with others
         * as we share a development queue in GCP pub sub
         *
         * Alternatively, use an emulator!
         */
        throw new Error(
          'PubSubConfig.topicPrefix MUST be set to a non-clashing value i.e your username.: See @rumbleship/gql: RfiPubSub'
        );
      }
    }
  }

  // Couldn't get typescript to be happy with 'extends', so we end up repeat ourselves
  public async publish(triggerName: string, payload: any): Promise<void> {
    triggerName = `${this.topicPrefix}_${triggerName}`;
    await this.createTopicIfNotExist(triggerName);
    return super.publish(triggerName, payload);
  }

  public async subscribe(
    triggerName: string,
    onMessage: (message: string) => null,
    // Upstream definition uses Object but tslint does not like that
    // tslint:disable-next-line: ban-types
    options?: Object
  ): Promise<number> {
    triggerName = `${this.topicPrefix}_${triggerName}`;
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

  public async deleteCurrentSubscriptionsMatchingPrefix() {
    const [subscriptions] = await this.pubSubClient.getSubscriptions();
    const mySubscriptions = subscriptions.filter((s: any) =>
      s.name.match(new RegExp(`${this.topicPrefix}`))
    );
    for await (const { name } of mySubscriptions) {
      // tslint:disable-next-line: no-console
      console.log(`Deleting subscription: ${name}`);
      await this.pubSubClient.subscription(name).delete();
      // tslint:disable-next-line: no-console
      console.log(`\tDeleted subscription: ${name}`);
    }
  }

  public async resetCurrentSubscriptionsMatchingPrefix() {
    const [subscriptions] = await this.pubSubClient.getSubscriptions();
    const mySubscriptions = subscriptions.filter((s: any) =>
      s.name.match(new RegExp(`${this.topicPrefix}`))
    );
    for await (const {
      name,
      metadata: { topic }
    } of mySubscriptions) {
      // tslint:disable-next-line: no-console
      console.log(`Deleting subscription: ${name}`);
      await this.pubSubClient.subscription(name).delete();
      await this.pubSubClient.topic(topic).createSubscription(name);
      // tslint:disable-next-line: no-console
      console.log(`\tRecreated subscription: ${name}`);
    }
  }

  private async createTopicIfNotExist(topicName: string): Promise<void> {
    const topics = await this.pubSubClient.getTopics();
    if (topics.indexOf(topicName) < 0) {
      try {
        await this.pubSubClient.createTopic(topicName);
      } catch (e) {
        if (!(e.code === status.ALREADY_EXISTS)) {
          // It can be created during a race condition,
          // so only rethrow if it is another error
          throw e;
        }
      }
    }
  }
}
