import { RumbleshipBeeline } from '@rumbleship/o11y';
import { MiddlewareFn } from 'type-graphql';

export const SubscriptionTracePropagation: MiddlewareFn = async (
  { root, args, context, info },
  next
) => {
  const resp = await next();
  if (info.parentType.name === 'Subscription') {
    const marshalled_trace = (context as any).beeline.bindFunctionToTrace(() =>
      RumbleshipBeeline.marshalTraceContext((context as any).beeline.getTraceContext())
    )();
    Reflect.set(resp, 'marshalled_trace', marshalled_trace);
  }

  return resp;
};
