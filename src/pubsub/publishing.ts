//import { PubSubEngine } from 'type-graphql';
//import { RfiPubSubEngine as PubSubEngine } from './index';
import { RfiPubSubEngine } from './index';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions, UpdateOptions } from 'sequelize';
// For creating topics which don't exist
//import { PubSub as GooglePubSub, Subscription, Topic } from '@google-cloud/pubsub';

//import { hostname } from 'os';

import { Oid } from '@rumbleship/oid';

import {
  NotificationOf,
  // DbModelChangeNotification,
  NODE_CHANGE_NOTIFICATION,
  ModelDelta
} from '../gql/node-notification';

// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below

// @ts-ignore
function payloadFromModel(model: Model): any{
  const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model')
  const payloadClassName: string = fullClassName.substr(0, idx);
  // @ts-ignore: not sure how to tell it get returns a string
  const oid: string = Oid.create(payloadClassName, model.get('id')).toString();
  return {oid: oid, payload_class: payloadClassName, id: model.get('id')}
}

// @ts-ignore
// FIXME 'any's
async function _publishPayload(pubSub: RfiPubSubEngine, notification: any, rawPayload: Model, deltas: any): Promise<void> {
  var rval = payloadFromModel(rawPayload)
  rval.action = notification;
  rval.deltas = deltas;
  const payload = JSON.stringify(rval);

  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;

  console.log('Publishing', payload, 'to topic', NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  console.log('Publishing', payload, 'to topic', topicName);
  pubSub.publish(topicName, payload);
}

// FIXME
export function publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: Array<any>): Promise<void> {
  return _publishPayload(pubSub, notification, payload, deltas);
}
