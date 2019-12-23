// TODO namespace
// export * from './setup';

// export namespace PubSub {
//   export * from './setup';
//   export * from './helper';
//   export * from './publishing';
//   export * from './subscriptions';
//   export 
// 
// 
//   
// 
// }

// future
//export * from './google-pubsub.ts';
//export * from './test-pubsub.ts';

//import { Model, CreateOptions, UpdateOptions } from 'sequelize';
import { Model } from 'sequelize';
import { PubSubEngine } from 'type-graphql';

import { PubSub as GooglePubSubLib, Topic } from '@google-cloud/pubsub';
import { GooglePubSub as ApolloPubSubLib } from '@axelspringer/graphql-google-pubsub';

/**

export abstract class PubSubEngine {
  public abstract publish(triggerName: string, payload: any): Promise<void>;
  public abstract subscribe(triggerName: string, onMessage: Function, options: Object): Promise<number>;
  public abstract unsubscribe(subId: number);
  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers);
  }
}

export class PubSub {
  constructor() {
    this.gcloudPubSub new
  }

}
**/

//export namespace Singleton {
//    export function someMethod() { ... }
//}

// const options = {
//   projectId: 'project-abc',
//   credentials:{
//     client_email: 'client@example-email.iam.gserviceaccount.com',
//     private_key: '-BEGIN PRIVATE KEY-\nsample\n-END PRIVATE KEY-\n'
//   }
// };

//import { PubSubEngine } from 'type-graphql';
//import { initGooglePubSub } from './setup';

import { publishPayload } from './publishing';

import { uniqueSubscriptionNamePart } from './helper';

import { NotificationOf } from '../gql/node-notification';

export const googlePubSubOptions = {googlePubSubOptions: {
    project: {
      doc: 'Gcloud project name',
      format: 'nonempty-string',
      default: 'the-development-project',
      env: 'GCLOUD_PUBSUB_PROJECT_NAME',
    },
    credentials: {
      username: {
        doc: 'Gcloud (service) account name',
        format: 'nonempty-string',
        default: 'the-pubsub-service-account',
        env: 'GCLOUD_PUBSUB_USERNAME',
      },
      privateKey: {
        doc: 'Gcloud (service) account auth key',
        format: 'nonempty-string',
        default: '-BEGIN-NON-FUNCTIONAL-KEY',
        env: 'GCLOUD_PUBSUB_KEY',
      },
    },
  },
};

/*
export interface RfiPubSubEngine extends PubSubEngine {
  //subscribe(topic: string, x: any, y: object): any;

  //subscribe(topic: string, x: any, y: object): AsyncIterator; //(notification: any): void); 

  publishPayload(
      notificationType: NotificationOf,
      model: Model, deltas: Array<any>): void;

  //publish(...args: any): void;
  publish(triggerName: string, payload: any): Promise<void>;
  subscribe(...args: any): Promise<number>;
  unsubscribe(...args: any): Promise<void>;
  //next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
  asyncIterator(...args: any): AsyncIterator<T, any, undefined>;
//4     next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
}

*/

//[export interface RfiPubSubEngine extends PubSubEngine{
export interface PubEngine extends PubSubEngine{
  //googlePubSub: any;

  publishPayload(
      notificationType: NotificationOf,
      model: Model, deltas: Array<any>): void;
}

export type RfiPubSubEngine = PubEngine & PubSubEngine;

export class RfiPubSub extends ApolloPubSubLib implements RfiPubSubEngine {

  //googlePubSub: any;

  constructor(config: any) {
    super(config, uniqueSubscriptionNamePart);
  }

  // Couldn't get typescript to be happy with 'extends', so repeat ourselves
  // here
  public publish(triggerName: string, payload: any): Promise<void> {
    console.log('pub', super.publish);
    return super.publish(triggerName, payload);
  }

  public subscribe(triggerName: string, onMessage: Function, options: Object): Promise<number> {
    return super.subscribe(triggerName, onMessage, options);
  }

  public unsubscribe(subId: number): any {
    return super.unsubscribe(subId);
  }

  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>{
    return super.asyncIterator(triggers);
  }

  public publishPayload(
      notificationType: NotificationOf,
      model: Model, deltas: Array<any>): void {

    //publishPayload(this.pubSubClient, notificationType, model, deltas);
    // ^ does not work but is able too access it, so need for local var for the google implmenetation
    publishPayload(this, notificationType, model, deltas);
  }
}

