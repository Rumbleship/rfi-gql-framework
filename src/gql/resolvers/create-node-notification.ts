import { BaseReadableResolverInterface } from './base-resolver.interface';
import { hostname } from 'os';
import { ClassType } from '../../helpers';
import { Node, NodeNotification } from '../relay';

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

export interface RawPayload {
  data: { toString(): string };
}

export async function createNodeNotification<TApi extends Node<TApi> = any>(
  raw: RawPayload,
  resolver: BaseReadableResolverInterface<TApi, any, any>,
  NotificationType: ClassType<NodeNotification<TApi>>
) {
  const ctx = resolver.ctx;
  return ctx.beeline.bindFunctionToTrace(async () => {
    return ctx.beeline.withAsyncSpan({ name: 'createPayload' }, async _span => {
      const received = JSON.parse(raw.data.toString());
      ctx.beeline.addTraceContext({
        'node.id': received.oid.toString(),
        'payload.action': received.action
      });
      const node = await resolver.getOne(received.oid);
      const gql_node_notification: NodeNotification<any> = new NotificationType(
        received.action,
        node
      );
      return gql_node_notification;
    });
  })();
}
