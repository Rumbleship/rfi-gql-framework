import { Model } from 'sequelize';
import { Oid } from '@rumbleship/oid';
import { RfiPubSubEngine } from './index';

import {
  NODE_CHANGE_NOTIFICATION,
  NotificationOf,
  ModelDelta
} from '../gql/node-notification';

// FIXME - cannot pass in { config } but we want to do that
//import { logging } from '@rumbleship/spyglass';
//const logger = logging.getLogger({});

// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below

interface Payload {
  oid: string;
  payload_class: string;
  id: string;
  action: string;
  deltas: ModelDelta[];
}

function payloadFromModel(model: Model): {oid: string; payload_class: string, id: string} {
  const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model')
  const payloadClassName: string = fullClassName.substr(0, idx);
  const modelId = model?.get('id') as string;
  const oid: string = Oid.create(payloadClassName, modelId).toString();
  return {oid: oid, payload_class: payloadClassName, id: modelId}
}

async function _publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, rawPayload: Model, deltas: ModelDelta[]): Promise<void> {
  var rval = payloadFromModel(rawPayload) as Payload;
  rval.action = notification;
  rval.deltas = deltas;
  const payload = JSON.stringify(rval);

  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;

  // FIXME - enable when logger object can be used here
  //logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  //logger.debug('Publishing ' + payload + ' to topic ' + topicName);
  pubSub.publish(topicName, payload);
}

export function publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: ModelDelta[]): Promise<void> {
  return _publishPayload(pubSub, notification, payload, deltas);
}
