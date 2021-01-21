import { RumbleshipBeeline } from '@rumbleship/o11y';
import { MiddlewareFn } from 'type-graphql';

export const SubscriptionTracePropagation: MiddlewareFn = async (
  { root, args, context, info },
  next
) => {
  const resp = await next();
  const marshalled_trace =
    info.parentType.name === 'Subscription'
      ? (context as any).beeline.bindFunctionToTrace(() =>
          RumbleshipBeeline.marshalTraceContext((context as any).beeline.getTraceContext())
        )()
      : undefined;

  // console.log(resp);
  return { ...resp, marshalled_trace };
};
