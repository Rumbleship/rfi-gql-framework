import { DbModelAndOidScope } from './../db/init-sequelize';
import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';

import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

import { publishPayload } from './publishing';
import { uniqueSubscriptionNamePart } from './helper';
import { NotificationOf } from '../gql/node-notification';
import { status } from '@grpc/grpc-js';
import { RfiPubSubConfig } from './pub_sub_config';
import { hostname } from 'os';

export interface PubEngine extends PubSubEngine {
  publisher_version: string;
  publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
  protected topicPrefix: string;
  public publisher_version: string;
  constructor(publisher_version: string, config: RfiPubSubConfig) {
    const { topicPrefix } = config;
    super(config, uniqueSubscriptionNamePart);
    this.topicPrefix = topicPrefix;
    this.publisher_version = publisher_version;
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

  public async createSubscriptionsFor(dbModels: DbModelAndOidScope[]) {
    for await (const { scope } of dbModels) {
      const triggerName = `${this.topicPrefix}_NODE_CHANGE_NOTIFICATION_${scope}`;
      await this.pubSubClient.topic(triggerName).createSubscription(triggerName + `-${hostname()}`);
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
