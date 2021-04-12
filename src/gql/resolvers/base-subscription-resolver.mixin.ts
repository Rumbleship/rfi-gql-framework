import { NodeNotification, SubscriptionWatchFilter, Node } from '../relay';
import { ClassType } from '../../helpers/classtype';
import { Scopes } from '@rumbleship/acl';
import { AddToTrace } from '@rumbleship/o11y';
import { Authorized, Root, Args, Resolver } from 'type-graphql';
import { RumbleshipSubscription } from './rumbleship-subscription';
import { createNodeNotification, RawPayload } from './create-node-notification';
import { BaseReadableResolverInterface } from './base-resolver.interface';
import { triggerName } from '../../app/server/topic-name';

export function withSubscriptionResolver<
  TBase extends ClassType<BaseReadableResolverInterface<TApi, any, any>>,
  TApi extends Node<TApi>,
  TNotification extends NodeNotification<TApi>,
  TSubscriptionFilter extends SubscriptionWatchFilter
>(
  capitalizedName: string,
  Base: TBase,
  notificationClsType: ClassType<TNotification>,
  subscriptionFilterClsType: ClassType<TSubscriptionFilter>,
  defaultScope: Scopes | Scopes[]
) {
  @Resolver({ isAbstract: true })
  class SubscriptionResolver extends Base {
    @Authorized(defaultScope)
    @RumbleshipSubscription(type => notificationClsType, {
      name: `on${capitalizedName}Change`,
      // topics: `${NODE_CHANGE_NOTIFICATION}_${capitalizedName}`,
      topics: triggerName(undefined, capitalizedName),
      nullable: true
    })
    @AddToTrace()
    async onChange(
      @Root() rawPayload: RawPayload | undefined,
      @Args(type => subscriptionFilterClsType) args: SubscriptionWatchFilter
    ): Promise<NodeNotification<TApi> | null> {
      if (rawPayload) {
        return createNodeNotification(rawPayload, this, notificationClsType, args?.watch_list);
      }
      return null;
    }
  }
  return SubscriptionResolver;
}
