import { ClassType } from '../../helpers';
import { BaseReadableResolverInterface } from './base-resolver.interface';
import { ModelDelta, Node, NodeNotification } from '../relay';
import { NodeChangePayload } from '../../app/server/rfi-pub-sub-engine.interface';

export interface RawPayload {
  data: { toString(): string };
}

export async function createNodeNotification<TApi extends Node<TApi> = any>(
  raw: RawPayload,
  resolver: BaseReadableResolverInterface<TApi, any, any>,
  NotificationType: ClassType<NodeNotification<TApi>>,
  delta_keys?: string[]
): Promise<NodeNotification<TApi>> {
  const ctx = resolver.ctx;
  return ctx.beeline.bindFunctionToTrace(async () => {
    return ctx.beeline.withAsyncSpan({ name: 'createPayload' }, async _span => {
      const received: NodeChangePayload = JSON.parse(raw.data.toString());
      const modeldeltas: ModelDelta[] = [];
      if (delta_keys) {
        for (const key of delta_keys) {
          const found = received.deltas.find(delta => delta.key === key);
          if (found) {
            modeldeltas.push(found);
          }
        }
      }
      ctx.beeline.addTraceContext({
        'relay.node.id': received.oid.toString(),
        'payload.action': received.action
      });
      const node = await resolver.getOne(received.oid);
      const gql_node_notification = new NotificationType(
        received.action,
        received.idempotency_key,
        node,
        modeldeltas
      );
      return gql_node_notification;
    });
  })();
}
