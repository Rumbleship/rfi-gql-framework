import { Model } from 'sequelize';
import { RfiPubSubEngine } from './index';

import { NODE_CHANGE_NOTIFICATION, NotificationOf, ModelDelta } from '../gql/node-notification';
import { apiKey } from '../db';

// Cannot access app level config for debug logging
// import { logging } from '@rumbleship/spyglass';
// const logger = logging.getLogger({});

export interface Payload {
  oid: string;
  id: string;
  action: string;
  deltas: ModelDelta[];
}

function payloadFromModel(model: Model): { oid: string; id: string } {
  let node;
  if (apiKey in model) {
    node = Reflect.get(model, apiKey);
  }
  /* const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model');
  const payloadClassName: string = fullClassName.substr(0, idx);
  */
  const modelId = model?.get('id') as string;
  const oid = node?.id.toString();
  return { oid, id: modelId };
}

async function _publishPayload(
  pubSub: RfiPubSubEngine,
  notification: NotificationOf,
  rawPayload: Model,
  deltas: ModelDelta[]
): Promise<void> {
  const rval = payloadFromModel(rawPayload) as Payload;
  rval.action = notification;
  rval.deltas = deltas;
  const payload = JSON.stringify(rval);

  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;

  // FIXME - enable when logger object can be used here
  // logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  // logger.debug('Publishing ' + payload + ' to topic ' + topicName);
  pubSub.publish(topicName, payload);
}

export function publishPayload(
  pubSub: RfiPubSubEngine,
  notification: NotificationOf,
  payload: Model,
  deltas: ModelDelta[]
): Promise<void> {
  return _publishPayload(pubSub, notification, payload, deltas);
}