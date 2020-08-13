import { SubscriptionWatchFilter } from '../relay/mixins/with-subscription-filter.mixin';
import { payloadOnWatchList } from './payload-on-watch-list';
import { RawPayload } from './create-node-notification';
import { RumbleshipContext } from '../../app/rumbleship-context/rumbleship-context';
import { NodeChangePayload } from '../../app/server/rfi-pub-sub-engine.interface';
import { Oid } from '@rumbleship/oid';
import { RelayService, NodeService, Node } from '../relay/relay.interface';
import { NotFoundError } from '../../app/errors';
/**
 * THis is used as a standalone helper as it can be called from any Resolver - and is the
 * @important DEFAULT filter for any subscription defined with @RumbleshipSubscription
 *
 * It handles looking for notifications that a client has added a watch for as well as
 * ensures that any security is dealt with.
 *
 * Specialized resolvers that need to provide more functionality should follow this function
 *
 * @todo split this function into smaller pieces so the parts can be used by specialized resolvers
 *
 * @param param0
 */
export async function filterBySubscriptionFilter({
  payload: rawPayload,
  args,
  context
}: {
  payload: RawPayload;
  args?: SubscriptionWatchFilter;
  context: RumbleshipContext;
}): Promise<boolean> {
  const res = await context.beeline.bindFunctionToTrace(async () => {
    return context.beeline.withAsyncSpan(
      { name: 'subscription.filterBySubscriptionFilter' },
      async () => {
        const nodePayload: NodeChangePayload = JSON.parse(rawPayload.data.toString());
        context.beeline.addTraceContext({ subscription: { filter: args, payload: nodePayload } });
        const traceReturn = (ret: boolean): boolean => {
          context.beeline.addTraceContext({ subscription: { filter: { result: ret } } });
          return ret;
        };
        let filter: SubscriptionWatchFilter = {};
        if (args) {
          if (args.id && args.id !== nodePayload.oid) {
            return traceReturn(false);
          }
          if (!payloadOnWatchList(nodePayload, args?.watch_list)) {
            return traceReturn(false);
          }

          const { watch_list, ...rest } = args;
          filter = rest ?? {};
        } else {
          // set the id on the filter, so findOne can do an auth check on
          // whether the client is allowed to see this notification
          filter.id = nodePayload.oid;
        }
        const oid = new Oid(nodePayload.oid);
        const { scope } = oid.unwrap();
        const nodeServices = context.container.get('nodeServices') as object;
        if (scope in nodeServices) {
          // Does this match, and are we allowed to see it?
          const node = await (Reflect.get(nodeServices, scope) as RelayService<
            any,
            any,
            any,
            any,
            any
          >).findOne(filter);
          if (node) {
            return traceReturn(true);
          }
        }
        return traceReturn(false);
      }
    );
  })();
  return res;
}

export async function filterById({
  payload: rawPayload,
  args,
  context
}: {
  payload: RawPayload;
  args?: { id?: string };
  context: RumbleshipContext;
}): Promise<boolean> {
  const res = await context.beeline.bindFunctionToTrace(async () => {
    return context.beeline.withAsyncSpan({ name: 'subscription.filter' }, async () => {
      if (!args?.id) {
        return true;
      }
      const payload: NodeChangePayload = JSON.parse(rawPayload.data.toString());
      context.beeline.addTraceContext({ 'subscription.filter.id': args.id });

      const oid = new Oid(payload.oid);
      const { scope } = oid.unwrap();
      let node;
      const nodeServices = context.container.get('nodeServices') as object;
      if (scope in nodeServices) {
        try {
          node = await (Reflect.get(nodeServices, scope) as NodeService<Node<object>>).getOne(oid);
        } catch (error) {
          context.beeline.addTraceContext({ error });
          if (error instanceof NotFoundError) {
            context.beeline.addTraceContext({ 'subscription.filter.result': false });
            return false;
          }
          throw error;
        }
      }
      const filtered = node ? node.id.toString() === args?.id : false;
      context.beeline.addTraceContext({ 'subscription.filter.result': filtered });
      return filtered;
    });
  })();
  return res;
}
