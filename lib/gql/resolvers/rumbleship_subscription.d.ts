import { OnDemandRumbleshipContext } from '../../app/rumbleship-context/on-demand-rumbleship-context';
import { SubscriptionOptions, ResolverTopicData, ArgsDictionary } from 'type-graphql';
import { filterBySubscriptionFilter } from './filter_by_subscription_filter';
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
    filter?: typeof filterBySubscriptionFilter | undefined;
    topics: (args: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>) => string | string[];
    nullable?: boolean | "items" | "itemsAndList" | undefined;
    defaultValue?: any;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    name?: string | undefined;
    complexity?: number | import("graphql-query-complexity").ComplexityEstimator | undefined;
    subscribe: import("graphql-subscriptions").ResolverFn;
} | {
    filter?: import("type-graphql/dist/decorators/types").SubscriptionFilterFunc | typeof filterBySubscriptionFilter | undefined;
    topics: (args: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>) => string | string[];
    nullable?: boolean | "items" | "itemsAndList" | undefined;
    defaultValue?: any;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    name?: string | undefined;
    complexity?: number | import("graphql-query-complexity").ComplexityEstimator | undefined;
    subscribe?: undefined;
};
/**
 * Decorator wrapping standard @Subscription that add in QueuedSubscription processing
 * @param returnTypeFunc
 * @param options
 */
export declare function RumbleshipSubscription(returnTypeFunc: (type: any) => any, options: SubscriptionOptions): MethodDecorator;
export {};
