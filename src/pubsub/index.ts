export * from './helper';
export * from './publishing';
import { PubSubEngine } from 'type-graphql';
import { Model } from 'sequelize-typescript';

import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

import { publishPayload } from './publishing';
import { uniqueSubscriptionNamePart } from './helper';
import { NotificationOf } from '../gql/node-notification';

export const GCPPubSub = {
  project: {
    doc: 'Gcloud project name',
    format: String,
    default: 'the-development-project',
    env: 'GCLOUD_PUBSUB_PROJECT_NAME'
  },
  client_email: {
    doc: 'Gcloud (service) account name',
    format: 'nonempty-string',
    default: "pubsub-rw-svc-acct@rfi-devel-project.iam.gserviceaccount.com",
    env: 'GCLOUD_PUBSUB_USERNAME'
  },
  private_key: {
    doc: 'Gcloud (service) account auth key',
    format: 'nonempty-string',
    default: '-BEGIN-NON-FUNCTIONAL-KEY',
    env: 'GCLOUD_PUBSUB_KEY'
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
    this.createTopicIfNotExist(triggerName);
    return super.publish(triggerName, payload);
  }

  public async subscribe(
    triggerName: string,
    onMessage: (message: string) => null,
    // Upstream definition uses Object but tslint does not like that
    options?: Object, // tslint:disable-line
  ): Promise<number> {
    this.createTopicIfNotExist(triggerName);
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
    try {
      await this.pubSubClient.topic(topicName);
    } catch(err) {
      await this.pubSubClient.createTopic(topicName);
    }
  }
}
