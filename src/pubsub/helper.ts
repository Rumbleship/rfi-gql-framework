import { Connection } from './../gql/connection.type';
import { BaseResolverInterface } from './../../lib/gql/base-resolver.interface.d';
import { RelayService } from './../gql/relay.service';
import { Model } from 'sequelize-typescript';
import { hostname } from 'os';
import { Oid } from '@rumbleship/oid';

import { NodeNotification, Node } from '../gql';
import { ClassType } from './../helpers/classtype';
import { RequireAtLeastOne } from 'src/interfaces';

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

/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface OIDPayloadCreator {
  getOne(id: Oid): Promise<any>;
}

/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface StrPayloadCreator {
  getOne(id: string): Promise<any>;
}

interface GetOne {
  getOne(id: Oid | string): Promise<Node<any>>;
}
type ServiceOrResolver<
  TApi extends Node<TApi> = Node<any>,
  TConnection extends Connection<TApi> = Connection<TApi>,
  TFilter = any,
  TInput = any,
  TUpdate = any
> = GetOne &
  RequireAtLeastOne<
    RelayService<TApi, TConnection, TFilter, TInput, TUpdate> &
      BaseResolverInterface<TApi, TConnection, TFilter, TInput, TUpdate>
  >;

export interface RawPayload {
  data: { toString(): string };
}

export async function createPayload(
  raw: RawPayload,
  invoker: ServiceOrResolver,
  NotificationType: ClassType<NodeNotification<any>>
) {
  const ctx = invoker.ctx ?? invoker.getContext?.apply(invoker)!;
  return ctx.beeline.bindFunctionToTrace(async () => {
    return ctx.beeline.withSpan({ name: 'createPayload' }, async _span => {
      const received = JSON.parse(raw.data.toString());
      const node = await (() => {
        // This is awful, ugly, and all sorts of terrible. But I don't have a better way to distinguish
        // ((AT RUNTIME)) whether the invoker was a Resolver (which expects a String) or if it was a Service
        // (which expects an Oid object). Workaround to consider: make the constructor of `Oid` accept
        // a string or an Oid, and just return the Oid object if so...
        if ('getAssociated' in invoker) {
          return invoker.getOne(new Oid(received.id));
        }
        return invoker.getOne(received.id);
      })();
      ctx.beeline.addContext({ 'node.id': node.id.toString(), 'payload.action': received.action });
      const gql_node_notification: NodeNotification<any> = new NotificationType(
        received.action,
        node
      );
      return gql_node_notification;
    });
  })();
}

/**
 * @deprecated in favor of combined `createPayload()`
 */
export async function createPayloadUsingStr(
  rawPayload: RawPayload,
  resolver: StrPayloadCreator,
  notificationClsType: ClassType<any>
): Promise<NodeNotification<any>> {
  // tslint:disable-next-line: no-console
  console.warn(
    '`pubsub_helper.createPayloadUsingStr` is deprecated; use generic `createPayload` instead'
  );
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
  // tslint:disable-next-line: no-console
  console.warn(
    '`pubsub_helper.createPayloadUsingOid` is deprecated; use generic `createPayload` instead'
  );
  const recieved = JSON.parse(rawPayload.data.toString());
  const strOid = recieved?.oid;
  const oid: Oid = new Oid(strOid);
  const node: Model = await resolver.getOne(oid);
  const gqlNodeNotification: NodeNotification<any> = new notificationClsType(recieved.action, node);
  return gqlNodeNotification;
}
