import { ArgsType, Field } from 'type-graphql';
import { ClassType } from '../../../helpers/classtype';
import { DateRangeGQL, DateRange } from '../../scalars/daterange.scalar';
import { WatchList } from '../../../queued-subscription-server/watchlist';

export function withTimeStampsFilter<TFilterBase extends ClassType<object>>(Base: TFilterBase) {
  @ArgsType()
  class TimeStampsFilter extends Base {
    @WatchList
    @Field(type => Date, { nullable: true })
    created_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    created_between?: DateRange;

    @WatchList
    @Field(type => Date, { nullable: true })
    updated_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    updated_between?: DateRange;

    @WatchList
    @Field(type => Date, { nullable: true })
    deleted_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    deleted_between?: DateRange;
  }
  return TimeStampsFilter;
}
