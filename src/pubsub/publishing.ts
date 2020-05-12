import { Model } from 'sequelize-typescript';
// tslint:disable-next-line: no-circular-imports
import { RfiPubSubEngine } from './index';

import { NODE_CHANGE_NOTIFICATION, NotificationOf, ModelDelta } from '../gql/node-notification';
import { getOidFor, getScopeFor } from '../db';

// Cannot access app level config for debug logging
// import { logging } from '@rumbleship/spyglass';
// const logger = logging.getLogger({});

export interface Payload {
  publisher_version: string;
  oid: string;
  id: string;
  action: string;
  deltas: ModelDelta[];
}

function payloadFromModel(model: Model): { oid: string; id: string } {
  /* const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model');
  const payloadClassName: string = fullClassName.substr(0, idx);
  */
  const modelId = model?.get('id') as string;
  const oid = getOidFor(model).toString();
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
  rval.publisher_version = pubSub.publisher_version;
  const payload = JSON.stringify(rval);

  const oidScope = getScopeFor(rawPayload);
  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${oidScope}`;

  // FIXME - enable when logger object can be used here
  // logger.debug('Publishing ' + payload + ' to topic ' + NODE_CHANGE_NOTIFICATION);
  // tslint:disable-next-line: no-floating-promises
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  // logger.debug('Publishing ' + payload + ' to topic ' + topicName);
  // tslint:disable-next-line: no-floating-promises
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
