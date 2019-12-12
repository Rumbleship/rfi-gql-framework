"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_notification_1 = require("../gql/node-notification");
// For creating topics which don't exist
//import { GooglePubSub as PubSub } from '@axelspringer/graphql-google-pubsub';
const pubsub_1 = require("@google-cloud/pubsub");
//const {PubSub} = require('@google-cloud/pubsub');
//FIXME - do better than 'any'
// the issue is 'publish' 404's on the pubSubEngine obj
const googlePubSub = new pubsub_1.PubSub();
//async googlePubSub.createTopic(NODE_CHANGE_NOTIFICATION);
// FIXME - this is racey
var topicList = [];
async function listAllTopics() {
    // Lists all topics in the current project
    const [topics] = await googlePubSub.getTopics();
    topics.forEach((topic) => {
        const i = topic.name.lastIndexOf("/") + 1;
        const topicShortName = topic.name.slice(i);
        topicList.push(topicShortName);
    });
    //topicList.push(...topics);
    //console.log('Topics:');
    // FIXME - do better than 'any'
    //topics.forEach((topic: any) => console.log(topic.name));
    console.log('topicList has', topicList);
}
function setupGooglePubSub() {
    listAllTopics();
}
setupGooglePubSub();
// FIXME - this may be racy
// need to do this using promise/await/async/whatever
//googlePubSub.createTopic(NODE_CHANGE_NOTIFICATION);
/*
function getTopic(cb) {
  pubsub.createTopic(topicName, (err, topic) => {
    // topic already exists.
    if (err && err.code === 6) {
      cb(null, pubsub.topic(topicName));
      return;
    }
    cb(err, topic);
  });
}
*/
/**
 *
 */
function linkSequelizeToPubSubEngine(pubSub, sequelize) {
    // Install hooks on Sequelize that publish GqlNodeNotifications
    // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
    // GQL classes
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
exports.linkSequelizeToPubSubEngine = linkSequelizeToPubSubEngine;
function getChangedAttributes(instance) {
    const deltas = [];
    const values = instance.get({ plain: true });
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            if (instance.changed(key)) {
                const delta = {
                    key,
                    previousValue: instance.previous(key),
                    newValue: instance.get(key)
                };
                deltas.push(delta);
            }
        }
    }
    return deltas;
}
function publishCurrentState(instance) {
    const pubSub = pubSubFrom(instance.sequelize);
    if (pubSub) {
        const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.LAST_KNOWN_STATE, instance, []);
        pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
        // Also publish the specific Model
        pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
    }
}
exports.publishCurrentState = publishCurrentState;
const PubSubKey = Symbol('PubSubEngine');
function attachPubSubEngineToSequelize(pubSub, sequelize) {
    Reflect.set(sequelize, PubSubKey, pubSub);
}
function pubSubFrom(sequelize) {
    const pubSub = Reflect.get(sequelize, PubSubKey);
    return pubSub ? pubSub : null;
}
exports.pubSubFrom = pubSubFrom;
/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/
// The Resolvers will convert to a Gql subscription
function gqlCreateHook(pubSub, instance, deltas, options) {
    publishPayload(instance);
    // const payload = new DbModelChangeNotification(NotificationOf.CREATED, instance, deltas);
    // pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
    // // Also publish the specific Model
    // pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
function gqlUpdateHook(pubSub, instance, deltas, options) {
    publishPayload(instance);
    //const payload = new DbModelChangeNotification(NotificationOf.UPDATED, instance, deltas);
    //pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
    //// Also publish the specific Model
    //pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below
function getPayload(obj) {
    console.log('obj');
    console.log(obj);
    var className = 'unknown';
    var objectId = 'no id';
    if (typeof obj !== 'undefined') {
        className = obj.constructor.name;
        objectId = obj.get('id');
    }
    return JSON.stringify({ 'class': className, 'id': objectId });
}
function publishPayload(rawPayload) {
    const payload = getPayload(rawPayload);
    const topicName = `${node_notification_1.NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
    console.log(topicName, 'in pub payload');
    function publish() {
        googlePubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
        // Also publish the specific Model
        googlePubSub.publish(topicName, payload);
    }
    if (!topicList.includes(topicName)) {
        console.log(topicName, 'Is miSSING!\nCreating...');
        googlePubSub.createTopic(topicName, (err, topic) => {
            console.log("createTopic callbedback");
            topicList.push(topicName);
            if (err && err.code != 6) {
                // FIXME - log to platform logging system
                console.log("could not create topic");
                publish();
            }
        });
        return;
    }
    publish();
    /*
    
      // FIXME - can we do better for 'err' than 'any'?
      // has 'code' property that is unknown on 'object'
      googlePubSub.createTopic(topicName, (err: any, topic: string) => {
        console.log('creating topic, got', err.code, 'for', topic);
        // topic already exists.
        if (err && err.code === 6) {
          publish();
          return;
        }
        publish();
      })
      */
    //pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
    //// Also publish the specific Model
    //pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
//# sourceMappingURL=gql-pubsub-sequelize-engine.js.map