// export * from './setup';

// put stuff in here to start

import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions, UpdateOptions } from 'sequelize';
import {
  NotificationOf,
  // DbModelChangeNotification,
  NODE_CHANGE_NOTIFICATION,
  ModelDelta
} from '../gql/node-notification';
import { Oid } from '@rumbleship/oid';
import { PubSub as GooglePubSub, Subscription, Topic } from '@google-cloud/pubsub';
// import { GooglePubSub as AsyncPubSub } from '@axelspringer/graphql-google-pubsub';
const googlePubSub: any = new GooglePubSub();

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
      //console.log('CreateTopic adding topic', topicName);
      // FIXME - fix the race so we don't need to do this
      if (!topicListLoaded) {
        // the topic will get created later in publish
        console.log("No topics loaded, aborting add of", topicName);
        //reject({topicName})
        resolve({topicName});
        return;
      }
      if (!topicList.includes(topicName)) {
        console.log('Creating topic', topicName);
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

async function listAllTopics() {
  const [topics] = await googlePubSub.getTopics();

  topics.forEach((topic: { name: string }) => {
    const i = topic.name.toString().lastIndexOf('/') + 1;
    const topicShortName = topic.name.slice(i);
    topicList.push(topicShortName);
  });
  topicListLoaded = true;
  console.log('Loaded existing topics');
}

// FIXME - 'any'
// @ts-in
export async function SubscribeToThings(notificationClass: string, callback: any): Promise<void>{
// call back recieves the msg json

  //const topicName = NODE_CHANGE_NOTIFICATION
  const localTopicName: string = `${NODE_CHANGE_NOTIFICATION}_${notificationClass}`;
  //const fullTopicName =`# `projects/rumbleship/topics/NODE_CHANGE_NOTIFICATION`;
  const topicName: string = `projects/rumbleship/topics/${localTopicName}`;

  const strHostname: string = hostname()
  // FIXME - find a uniq
  const subscriptionName: string = `testSub-${strHostname}-${notificationClass}`;

  //Creates a new subscription
  const topic: Topic = googlePubSub.topic(topicName)
  try {
    await topic.createSubscription(subscriptionName);
  } catch (err) {
    console.log('error creating subscription')
  //} finally {
    //dgaf
  }

  // has now been created

  console.log(`Subscription ${subscriptionName} created.`);
// sub created

  const maxInProgress = 5;

  const subscriberOptions = {
    flowControl: {
      maxMessages: maxInProgress,
    },
  };

  var topic2:Topic = googlePubSub.topic(topicName);
  var subs: Subscription = topic2.subscription(subscriptionName, subscriberOptions);

  console.log('subs:', subs);
  subs.on('error', function(err) {
    console.log('subs error', err);
  });

  function onMessage(msg: any) {
    const data = JSON.parse(msg.data.toString())
    console.log('recieved msg', msg.id, 'at', msg.Timestamp)
    console.log('msg', data)
    callback(data);
    msg.ack();
  // message.id = ID of the message.
  // message.ackId = ID used to acknowledge the message receival.
  // message.data = Contents of the message.
  // message.attributes = Attributes of the message.
  // message.timestamp = Timestamp when Pub/Sub received the message.

  // Ack the message:
  // message.ack();
  }

  subs.on('message', onMessage);

  // there's a better rval...
  return new Promise((resolve, reject) => {
    resolve()
  });
}

// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below

// @ts-ignore
function payloadFromModel(model: Model): any{
  const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model')
  const payloadClassName: string = fullClassName.substr(0, idx);
  // @ts-ignore: not sure how to tell it get returns a string
  const oid = Oid.create(payloadClassName, model.get('id')).toString();
  return {oid: oid, payload_class: payloadClassName, id: model.get('id')}
}

// note last known state changes based on the kind of update
// @ts-ignore
// FIXME 'any's
async function publishPayload(notification: any, rawPayload: Model, deltas: any): Promise<void> {
  // Get the relevant pubsub from the model to future proof against having more than one pubsub
  const pubSub = pubSubFrom(rawPayload.sequelize as Sequelize);
  //const payload: string = makePayload(rawPayload);

  var rval = payloadFromModel(rawPayload)
  rval.action = notification;
  rval.deltas = deltas;
  const payload = JSON.stringify(rval);

  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
  await CreateTopic(topicName);
  if (!pubSub) {
    return;
  }

  console.log('Publishing', payload, 'to topic', NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  console.log('Publishing', payload, 'to topic', topicName);
  pubSub.publish(topicName, payload);
}


export async function initGooglePubSub() {
  await listAllTopics();
  await CreateTopic(NODE_CHANGE_NOTIFICATION);
  // await SubscribeToThings('BuilderApplicationModel', (data: any) => {
  //   console.log('got msg', data);
  // });
}



export publishPayloadToPubSub(){

}
