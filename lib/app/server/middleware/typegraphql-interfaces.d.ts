import { MiddlewareFn, MiddlewareInterface } from 'type-graphql';
export declare type MiddlewareClass<TContext = Record<string, any>> = new (...args: any[]) => MiddlewareInterface<TContext>;
export declare type Middleware<TContext = Record<string, any>> = MiddlewareFn<TContext> | MiddlewareClass<TContext>;
