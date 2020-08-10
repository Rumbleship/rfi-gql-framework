import { OnDemandRumbleshipContext } from './on-demand-rumbleship-context';
import { SubscriptionOptions, ResolverTopicData, ArgsDictionary } from 'type-graphql';
declare type SubscriptionTopicFunc = (resolverTopicData: ResolverTopicData<any, any, any>) => string | string[];
/***
 * @NOTE We make a 'pseudo' topic by adding queued in front og the topic to subscribe to if the context
 * has isQueuedSubscription set.
 *
 * @see RfiPubSub subscribe function to see how this peudo topic is handled
 *
 */
export declare function enableQueuedSubscriptionSupport<TPayload, TArgs>(params: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>, topics: string | string[] | SubscriptionTopicFunc | undefined): string | string[];
export declare function RumbleshipSubscriptionOptions<TPayload = any, TArgs = ArgsDictionary>(opts: SubscriptionOptions): {
    topics: (args: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>) => string | string[];
    nullable?: boolean | "items" | "itemsAndList" | undefined;
    defaultValue?: any;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    name?: string | undefined;
    complexity?: number | import("graphql-query-complexity").ComplexityEstimator | undefined;
    filter?: undefined;
    subscribe: import("graphql-subscriptions").ResolverFn; /***
     * @NOTE We make a 'pseudo' topic by adding queued in front og the topic to subscribe to if the context
     * has isQueuedSubscription set.
     *
     * @see RfiPubSub subscribe function to see how this peudo topic is handled
     *
     */
} | {
    topics: (args: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>) => string | string[];
    nullable?: boolean | "items" | "itemsAndList" | undefined;
    defaultValue?: any;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    name?: string | undefined;
    complexity?: number | import("graphql-query-complexity").ComplexityEstimator | undefined;
    subscribe?: undefined;
    filter?: import("type-graphql/dist/decorators/types").SubscriptionFilterFunc | undefined;
};
export declare function RumbleshipSubscription(returnTypeFunc: (type: any) => any, options: SubscriptionOptions): MethodDecorator;
export {};
