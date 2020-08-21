import {
  NodeNotification,
  SubscriptionWatchFilter,
  Node,
  NODE_CHANGE_NOTIFICATION
} from '../relay';
import { ClassType } from '../../helpers/classtype';
import { Scopes } from '@rumbleship/acl';
import { AddToTrace } from '@rumbleship/o11y';
import { Authorized, Root, Args } from 'type-graphql';
import { RumbleshipSubscription } from './rumbleship-subscription';
import { createNodeNotification, RawPayload } from './create-node-notification';
import { BaseReadableResolverInterface } from './base-resolver.interface';

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
  class SubscriptionResolver extends Base {
    @AddToTrace()
    @Authorized(defaultScope)
    @RumbleshipSubscription(type => notificationClsType, {
      name: `on${capitalizedName}Change`,
      topics: `${NODE_CHANGE_NOTIFICATION}_${capitalizedName}`,
      nullable: true
    })
    async onChange(
      @Root() rawPayload: RawPayload,
      @Args(type => subscriptionFilterClsType) args: SubscriptionWatchFilter
    ): Promise<NodeNotification<TApi>> {
      return createNodeNotification(rawPayload, this, notificationClsType);
    }
  }
  return SubscriptionResolver;
}
