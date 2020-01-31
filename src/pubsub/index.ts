export * from './helper';
export * from './publishing';
import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';

import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

import { publishPayload } from './publishing';
import { uniqueSubscriptionNamePart } from './helper';
import { NotificationOf } from '../gql/node-notification';

export const GCPPubSub = {
  projectId: {
    doc: 'Gcp project name',
    format: String,
    default: 'the-development-project',
    env: 'GCP_PUBSUB_PROJECT_NAME'
  },
  client_email: {
    doc: 'Gcp (service) account name',
    format: 'nonempty-string',
    default: "pubsub-rw-svc-acct@rfi-devel-project.iam.gserviceaccount.com",
    env: 'GCP_PUBSUB_USERNAME'
  },
  private_key: {
    doc: 'Gcp (service) account auth key',
    format: 'nonempty-string',
    default: '-BEGIN-NON-FUNCTIONAL-KEY',
    env: 'GCP_PUBSUB_KEY'
  }
};

export interface PubEngine extends PubSubEngine {
  publishPayload(notificationType: NotificationOf, model: Model, deltas: any[]): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {
  constructor(config: any) {
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
      await this.pubSubClient.createTopic(topicName);
    }
  }
}
