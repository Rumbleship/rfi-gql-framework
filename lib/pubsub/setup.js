"use strict";
// export * from './setup';
// put stuff in here to start
// import { PubSubEngine } from 'type-graphql';
// import { Sequelize } from 'sequelize-typescript';
// import { Model, CreateOptions, UpdateOptions } from 'sequelize';
// import {
//   NotificationOf,
//   // DbModelChangeNotification,
//   NODE_CHANGE_NOTIFICATION,
//   ModelDelta
// } from '../gql/node-notification';
// import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
// // import { GooglePubSub as AsyncPubSub } from '@axelspringer/graphql-google-pubsub';
// 
// import { RfiPubSub } from './index';
// 
// const googlePubSub: any = new GooglePubSub();
// 
// // const asyncPubSub: PubSubEngine = new AsyncPubSub();
// 
// // global to hold the list of existing topics
// let topicList: string[] = [];
// let topicListLoaded: boolean = false;
// Create a topic if it doesn't already exist
// This needs listAllTopics to have finished but loading that is racy
// model observer and event-dispatcher jump ahead before we're ready
//export function createTopic(topicName: string): Promise<void> {
//  return new Promise(
//    (resolve: any, reject: any): void => {
//      // TODO - log to platform logger
//      //console.log('CreateTopic adding topic', topicName);
//      // FIXME - fix the race so we don't need to do this
//      if (!topicListLoaded) {
//        // the topic will get created later in publish
//        console.log("No topics loaded, aborting add of", topicName);
//        //reject({topicName})
//        resolve({topicName});
//        return;
//      }
//      if (!topicList.includes(topicName)) {
//        console.log('Creating topic', topicName);
//        googlePubSub.createTopic(topicName, (err: { code: number }, topic: Topic) => {
//          // couldn't figure out the proper type but err.code is sufficient to catch
//          if (err === null) {
//            console.log('Topic', topicName, 'created successfully');
//            topicList.push(topicName);
//            resolve({ topicName });
//          } else {
//            console.log('Problem creating topic, err:', err, 'topic was:', topic);
//            reject({ topicName });
//          }
//        });
//      } else {
//        console.log('topic', topicName, 'aready exists, no need to create');
//        resolve({ topicName });
//      }
//    }
//  );
//}
//async function listAllTopics() {
//  const [topics] = await googlePubSub.getTopics();
//
//  topics.forEach((topic: { name: string }) => {
//    const i = topic.name.toString().lastIndexOf('/') + 1;
//    const topicShortName = topic.name.slice(i);
//    topicList.push(topicShortName);
//  });
//  topicListLoaded = true;
//  console.log('Loaded existing topics');
//}
//async function initGooglePubSub(this: RfiPubSub) {
//  //await listAllTopics(pubSub);
//  await createTopic(NODE_CHANGE_NOTIFICATION);
//
//
//
//  // await SubscribeToThings('BuilderApplicationModel', (data: any) => {
//  //   console.log('got msg', data);
//  // });
//}
//
//# sourceMappingURL=setup.js.map