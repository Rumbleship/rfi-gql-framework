import { MiddlewareFn } from 'type-graphql';

export const SubscriptionTracePropagation: MiddlewareFn = async (
  { root, args, context, info },
  next
) => {
  const resp = await next();
  console.log(resp);
  return resp;
};
