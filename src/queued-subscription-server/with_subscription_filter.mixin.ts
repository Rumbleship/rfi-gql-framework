import { ClassType } from '../helpers/classtype';
import { ArgsType, Field, ID, registerEnumType } from 'type-graphql';
import { buildSubscriptionWatchList } from './watchlist';

export interface SubscriptionWatchFilter {
  watch_list?: string[];
  id?: string;
}

/**
 *
 * @param Base
 */
export function withSubscriptionFilter<TFilterBase extends ClassType<object>>(
  Base: TFilterBase,
  watchListEnumNameOrEnum: string | { [x: string]: string }
) {
  let watchlistEnum: { [x: string]: string };
  if (typeof watchListEnumNameOrEnum === 'string') {
    watchlistEnum = buildSubscriptionWatchList(Base);
    registerEnumType(watchlistEnum, {
      name: watchListEnumNameOrEnum,
      description: `The list of properties that can be watched for change`
    });
  } else {
    watchlistEnum = watchListEnumNameOrEnum;
  }

  @ArgsType()
  class SubscriptionFilter extends Base implements SubscriptionWatchFilter {
    @Field(type => [watchlistEnum], {
      nullable: true,
      description:
        'List of attributes to watch. Subscription only triggers when one or more of these attributes change'
    })
    watch_list?: string[];
    @Field(type => ID, { nullable: true })
    id?: string;
  }
  return SubscriptionFilter;
}
