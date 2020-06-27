import { MiddlewareFn, MiddlewareInterface } from 'type-graphql';
export declare type MiddlewareClass<TContext = {}> = new (...args: any[]) => MiddlewareInterface<TContext>;
export declare type Middleware<TContext = {}> = MiddlewareFn<TContext> | MiddlewareClass<TContext>;
