import { MiddlewareFn, MiddlewareInterface } from 'type-graphql';
// MiddlewareClass and the union type are not exported by type-graphql, so we duplicate them here.
export type MiddlewareClass<TContext = Record<string, any>> = new (
  ...args: any[]
) => MiddlewareInterface<TContext>;
export type Middleware<TContext = Record<string, any>> =
  | MiddlewareFn<TContext>
  | MiddlewareClass<TContext>;
