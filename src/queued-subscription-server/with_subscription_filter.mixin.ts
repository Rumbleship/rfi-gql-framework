import { ClassType } from '../';
import { ArgsType, Field, ID } from 'type-graphql';

export interface SubscriptionWatchFilter {
  watch_list?: string[];
  id?: string;
}

/**
 *
 * @param Base
 */
export function withSubscriptionFilter<
  TFilterBase extends ClassType<object>,
  TEnumPropertyNames extends { [name: string]: any }
>(Base: TFilterBase, propertyNames: TEnumPropertyNames) {
  @ArgsType()
  class SubscriptionFilter extends Base implements SubscriptionWatchFilter {
    @Field(type => [propertyNames], {
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
