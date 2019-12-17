import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions, UpdateOptions } from 'sequelize';
import {
  NotificationOf,
  // DbModelChangeNotification,
  NODE_CHANGE_NOTIFICATION,
  ModelDelta
} from '../gql/node-notification';

import { hostname } from 'os';

import { Oid } from '@rumbleship/oid';

import { CreateTopic } from '../pubsub';

// For creating topics which don't exist
import { PubSub as GooglePubSub, Subscription, Topic } from '@google-cloud/pubsub';
// use the gcloud pubsub apollo lib elsewhere
// import { GooglePubSub as AsyncPubSub } from '@axelspringer/graphql-google-pubsub';

// FIXME - do better than 'any'
// the issue is 'publish' 404's on the pubSubEngine obj
const googlePubSub: any = new GooglePubSub();
// this is threaded through from arbiter
// const asyncPubSub: PubSubEngine = new AsyncPubSub();

// global to hold the list of existing topics
let topicList: string[] = [];
let topicListLoaded: boolean = false;

// getTopics being async forces the whole chain to be async, which doesn't help
// how much there's a race going on

/**
 *
 */
export function linkSequelizeToPubSubEngine(pubSub: PubSubEngine, sequelize: Sequelize) {
  // Install hooks on Sequelize that publish GqlNodeNotifications
  // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
  // GQL classes

  // FIXME - is this the right place for this (prolly not);
  // where wants to be aware that we're doing google pub sub?
  // also libraryize
  // cant await this
  initGooglePubSub();

  attachPubSubEngineToSequelize(pubSub, sequelize);

  sequelize.afterCreate((instance, options) => {
    // Cache the previous values to closure so they can be published __after__ commit
    // (the previous vales will be overwritten on commit)
    const deltas = getChangedAttributes(instance);

    if (options && options.transaction) {
      options.transaction.afterCommit(t => gqlCreateHook(pubSub, instance, deltas, options));
      return;
    }
    gqlCreateHook(pubSub, instance, deltas, options);
  });

  sequelize.afterUpdate((instance, options) => {
    const deltas = getChangedAttributes(instance);
    if (options && options.transaction) {
      options.transaction.afterCommit(t => gqlUpdateHook(pubSub, instance, deltas, options));
      return;
    }
    gqlUpdateHook(pubSub, instance, deltas, options);
  });
  // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}

function getChangedAttributes(instance: Model<any, any>): ModelDelta[] {
  const deltas: ModelDelta[] = [];
  const values = instance.get({ plain: true });
  for (const key in values) {
    if (values.hasOwnProperty(key)) {
      if (instance.changed(key as any)) {
        const delta: ModelDelta = {
          key,
          previousValue: instance.previous(key as any),
          newValue: instance.get(key as any)
        };
        deltas.push(delta);
      }
    }
  }
  return deltas;
}

export function publishCurrentState(instance: Model<any, any>) {
  publishPayload(NotificationOf.LAST_KNOWN_STATE, instance, []);
  // if (pubSub) {
  //   const payload = new DbModelChangeNotification(NotificationOf.LAST_KNOWN_STATE, instance, []);
  //   pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  //   // Also publish the specific Model
  //   pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
  // }
}

const PubSubKey = Symbol('PubSubEngine');
function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
  Reflect.set(sequelize, PubSubKey, pubSub);
}

/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/

// The Resolvers will convert to a Gql subscription
function gqlCreateHook(
  pubSub: PubSubEngine,
  instance: Model<any, any>,
  deltas: ModelDelta[],
  options: CreateOptions
) {
  publishPayload(NotificationOf.CREATED, instance, deltas);

  //const foo = await instance.getBuyerApplication();
  // const payload = new DbModelChangeNotification(NotificationOf.CREATED, instance, deltas);
  // pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  // // Also publish the specific Model
  // pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
function gqlUpdateHook(
  pubSub: PubSubEngine,
  instance: Model<any, any>,
  deltas: ModelDelta[],
  options: UpdateOptions
) {
  publishPayload(NotificationOf.UPDATED, instance, deltas);
  // const payload = new DbModelChangeNotification(NotificationOf.UPDATED, instance, deltas);
  // pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  //// Also publish the specific Model
  // pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
