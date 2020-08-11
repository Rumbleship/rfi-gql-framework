import { OnDemandRumbleshipContext } from '../app/rumbleship-context/on-demand-rumbleship-context';
import { SubscriptionOptions, ResolverTopicData, ArgsDictionary, Subscription } from 'type-graphql';

// copied from type-graphql because it is not properly exposed
type SubscriptionTopicFunc = (
  resolverTopicData: ResolverTopicData<any, any, any>
) => string | string[];
/***
 * @NOTE We make a 'pseudo' topic by adding queued in front og the topic to subscribe to if the context
 * has isQueuedSubscription set.
 *
 * @see RfiPubSub subscribe function to see how this peudo topic is handled
 *
 */
export function enableQueuedSubscriptionSupport<TPayload, TArgs>(
  params: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>,
  topics: string | string[] | SubscriptionTopicFunc | undefined
): string | string[] {
  if (topics) {
    if (typeof topics === 'function') {
      topics = topics(params);
    }
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
  } else {
    topics = [];
  }
  if (params.context.isQueuedSubscription) {
    return topics.map(topic => `queued-${topic}`);
  } else {
    return topics;
  }
}

export function RumbleshipSubscriptionOptions<TPayload = any, TArgs = ArgsDictionary>(
  opts: SubscriptionOptions
) {
  const topics = opts.topics;

  const wrappedTopics = (args: ResolverTopicData<TPayload, TArgs, OnDemandRumbleshipContext>) => {
    return enableQueuedSubscriptionSupport(args, topics);
  };
  return { ...opts, topics: wrappedTopics };
}

/**
 * Decorator wrapping standard @Subscription that add in QueuedSubscription processing
 * @param returnTypeFunc
 * @param options
 */
export function RumbleshipSubscription(
  returnTypeFunc: (type: any) => any,
  options: SubscriptionOptions
): MethodDecorator {
  const opts: SubscriptionOptions = RumbleshipSubscriptionOptions(options) as any;
  return Subscription(returnTypeFunc, opts);
}
