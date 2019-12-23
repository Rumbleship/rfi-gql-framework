import { hostname } from 'os';
import { Model } from 'sequelize';
//import { Model, CreateOptions, UpdateOptions } from 'sequelize';

import { Oid } from '@rumbleship/oid';

//import { Node } from '../gql';

import {
  NodeNotification,
} from '../gql/node-notification';

import { GQLBaseResolver } from '../gql/base.resolver';


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

function randint(min: number, max: number): number{
  const diff: number = max - min;
  return Math.floor(Math.random() * Math.floor(diff)) + min;
}

function randchar(): number { // not technically a char as name implies
  return randint(97, 122); // a-z
}

function randstr(len: number) {
  return String.fromCharCode(...Array.from(new Array(len), randchar));
}

export function uniqueSubscriptionNamePart() {
  return '' + hostname() + '-' + randstr(6);
}

// Ideally we could use this as a commonMessageHandler but as notificationClsType is defined at (afaik) runtime, we can't use that patttern for this
export async function nodeNotficationFromPayload(rawPayload: any, resolver: GQLBaseResolver<any, any, any, any, any>, notificationClsType: ClassType<any>): Promise<NodeNotification<any>> {
      const recieved = JSON.parse(rawPayload.data.toString())
      const oid: Oid = new Oid(recieved.oid)
      const node: Model = await resolver.getOne(oid.toString());
      const gqlNodeNotification: NodeNotification<any> = new notificationClsType(recieved.action, node);
      return gqlNodeNotification;
}
