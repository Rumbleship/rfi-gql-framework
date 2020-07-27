import { ClassType } from '../../helpers';
import { BaseReadableResolverInterface } from './base-resolver.interface';
import { Node, NodeNotification } from '../relay';

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
        'relay.node.id': received.oid.toString(),
        'payload.action': received.action
      });
      const node = await resolver.getOne(received.oid);
      const gql_node_notification: NodeNotification<any> = new NotificationType(
        received.action,
        received.change_uuid,
        node
      );
      return gql_node_notification;
    });
  })();
}
