import { Model } from 'sequelize-typescript';
import { hostname } from 'os';
import { Oid } from '@rumbleship/oid';

import { NodeNotification, Node } from '../gql';
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

export interface PayloadCreator {
  getOne(id: Oid | string): Promise<Node<any>>;
}
export interface RawPayload {
  data: { toString(): string };
}

export async function createPayload(
  raw: RawPayload,
  resolver: PayloadCreator,
  notification_cls_type: ClassType<any>
) {
  const received = JSON.parse(raw.data.toString());
  const id: string = (() => {
    switch (typeof received.oid) {
      case 'string':
        return received.oid;
      case 'object':
        return new Oid(received.oid).toString();
      case 'undefined':
      default:
        throw new Error('Cannot create payload without an id');
    }
  })();

  const node = await resolver.getOne(id);
  const gql_node_notification: NodeNotification<any> = new notification_cls_type(
    received.action,
    node
  );
  return gql_node_notification;
}

// Ideally we could use this as a commonMessageHandler for
// graphql-google-pubsub but as notificationClsType is seemingly defined at
// runtime, we can't use that patttern here
/**
 * @deprecated in favor of combined `createPayload()`
 */
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

/**
 * @deprecated in favor of combined `createPayload()`
 */
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
