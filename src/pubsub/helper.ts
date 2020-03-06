import { hostname } from 'os';
import { Model } from 'sequelize';
import { Oid } from '@rumbleship/oid';

import { NodeNotification } from '../gql/node-notification';
import { ClassType } from './../helpers/classtype';

// The commented out currently exists in gql-pubsub-sequelize-engine.ts
// but ideally would be here instead. It does not work for an unknown reason,
// perhaps related to scope and Symbol('PubSubEngine')?
//
// const PubSubKey = Symbol('PubSubEngine');
// export function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
//   Reflect.set(sequelize, PubSubKey, pubSub);
// }
// export function pubSubFrom(sequelize: Sequelize): PubSubEngine | null {
//   const pubSub = Reflect.get(sequelize, PubSubKey);
//   return pubSub ? pubSub : null;
// }

export interface RfiSubscriptionOptions {
  asService?: boolean;
  serviceName?: string;
}
export function uniqueSubscriptionNamePart(
  topicName: string,
  subscriptionOptions?: RfiSubscriptionOptions
) {
  if (subscriptionOptions && subscriptionOptions.asService) {
    return `${topicName}-${subscriptionOptions.serviceName ?? 'any'}-ServiceSubscription`;
  } else {
    return `${topicName}-${hostname()}`;
  }
}

interface OIDPayloadCreator {
  getOne(id: Oid): Promise<any>;
}

interface StrPayloadCreator {
  getOne(id: string): Promise<any>;
}

export interface RawPayload {
  data: { toString(): string };
}

// Ideally we could use this as a commonMessageHandler for
// graphql-google-pubsub but as notificationClsType is seemingly defined at
// runtime, we can't use that patttern here
export async function createPayloadUsingStr(
  rawPayload: RawPayload,
  resolver: StrPayloadCreator,
  notificationClsType: ClassType<any>
): Promise<NodeNotification<any>> {
  const recieved = JSON.parse(rawPayload.data.toString());
  const strOid = recieved?.oid;
  const node: Model = await resolver.getOne(strOid);
  const gqlNodeNotification: NodeNotification<any> = new notificationClsType(recieved.action, node);
  return gqlNodeNotification;
}

export async function createPayloadUsingOid(
  rawPayload: RawPayload,
  resolver: OIDPayloadCreator,
  notificationClsType: ClassType<any>
): Promise<NodeNotification<any>> {
  const recieved = JSON.parse(rawPayload.data.toString());
  const strOid = recieved?.oid;
  const oid: Oid = new Oid(strOid);
  const node: Model = await resolver.getOne(oid);
  const gqlNodeNotification: NodeNotification<any> = new notificationClsType(recieved.action, node);
  return gqlNodeNotification;
}
