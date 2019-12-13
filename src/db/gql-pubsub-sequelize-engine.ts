import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions, UpdateOptions } from 'sequelize';
import {
  // NotificationOf,
  // DbModelChangeNotification,
  NODE_CHANGE_NOTIFICATION,
  ModelDelta
} from '../gql/node-notification';

import { Oid } from '@rumbleship/oid';

// For creating topics which don't exist
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
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

// Create a topic if it doesn't already exist
// This needs listAllTopics to have finished but loading that is racy
// model observer and event-dispatcher jump ahead before we're ready
export function CreateTopic(topicName: string): Promise<void> {
  return new Promise(
    (resolve: any, reject: any): void => {
      // TODO - log to platform logger
      console.log('CreateTopic wants to add topic:', topicName, 'Loaded topics::', topicList);
      // FIXME - fix the race so we don't need to do this
      if (!topicListLoaded) {
        // the topic will get created later in publish
        console.log("No topics loaded, aborting add of", topicName);
        //reject({topicName})
        return;
      }
      if (!topicList.includes(topicName)) {
        console.log('Creating topic', topicName, 'Loaded topics:', topicList);
        googlePubSub.createTopic(topicName, (err: { code: number }, topic: Topic) => {
          // couldn't figure out the proper type but err.code is sufficient to catch
          if (err === null) {
            console.log('Topic', topicName, 'created successfully');
            topicList.push(topicName);
            resolve({ topicName });
          } else {
            console.log('Problem creating topic, err:', err, 'topic was:', topic);
            reject({ topicName });
          }
        });
      } else {
        console.log('topic', topicName, 'aready exists, no need to create');
        resolve({ topicName });
      }
    }
  );
}

// getTopics being async forces the whole chain to be async, which doesn't help
// how much there's a race going on

async function listAllTopics() {
  const [topics] = await googlePubSub.getTopics();

  topics.forEach((topic: { name: string }) => {
    const i = topic.name.toString().lastIndexOf('/') + 1;
    const topicShortName = topic.name.slice(i);
    topicList.push(topicShortName);
  });
  topicListLoaded = true;
  console.log('existing topic list loaded:', topicList);
}

async function initGooglePubSub() {
  await listAllTopics();
  await CreateTopic(NODE_CHANGE_NOTIFICATION);
}

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

  //googlePubSub.publish('topic404', '{payload}');

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
  const pubSub = pubSubFrom(instance.sequelize as Sequelize);
  publishPayload(pubSub, instance);

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
export function pubSubFrom(sequelize: Sequelize): PubSubEngine | null {
  const pubSub = Reflect.get(sequelize, PubSubKey);
  return pubSub ? pubSub : null;
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
  //const foo = await instance.getBuyerApplication();
  publishPayload(pubSub, instance);
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
  publishPayload(pubSub, instance);
  // const payload = new DbModelChangeNotification(NotificationOf.UPDATED, instance, deltas);
  // pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  //// Also publish the specific Model
  // pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}

// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below

function makePayload(rawPayload: Model): string {
  const fullClassName: string = rawPayload.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model')
  const payloadClassName: string = fullClassName.substr(0, idx);
  // @ts-ignore: not sure how to tell it get returns a string
  const oid = Oid.create(payloadClassName, rawPayload.get('id')).toString();
  return JSON.stringify({ oid: oid });
}

// note last known state changes based on the kind of update
// @ts-ignore
async function publishPayload(pubSub: PubSubEngine | null, rawPayload: Model): Promise<void> {
  const payload: string = makePayload(rawPayload);
  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
  await CreateTopic(topicName);
  if (!pubSub) {
    return;
  }
  // TODO- take in an additional arg for notficationOf
  console.log('Publishing', payload, 'to topic', NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  // Also publish the specific Model
  console.log('Publishing', payload, 'to topic', topicName);
  pubSub.publish(topicName, payload);
}

