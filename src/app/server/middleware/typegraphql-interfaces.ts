import { MiddlewareFn, MiddlewareInterface } from 'type-graphql';
// MiddlewareClass and the union type are not exported by type-graphql, so we duplicate them here.
export type MiddlewareClass<TContext = {}> = new (...args: any[]) => MiddlewareInterface<TContext>;
export type Middleware<TContext = {}> = MiddlewareFn<TContext> | MiddlewareClass<TContext>;
