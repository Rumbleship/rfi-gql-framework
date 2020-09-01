import { ArgsType, Field } from 'type-graphql';
import { ClassType } from '../../../helpers/classtype';
import { DateRangeGQL, DateRange } from '../../scalars/daterange.scalar';
import { Watchable } from '../watchable';

export function withTimeStampsFilter<TFilterBase extends ClassType<Record<string, any>>>(
  Base: TFilterBase
) {
  @ArgsType()
  class TimeStampsFilter extends Base {
    @Watchable
    @Field(type => Date, { nullable: true })
    created_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    created_between?: DateRange;

    @Watchable
    @Field(type => Date, { nullable: true })
    updated_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    updated_between?: DateRange;

    @Watchable
    @Field(type => Date, { nullable: true })
    deleted_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    deleted_between?: DateRange;
  }
  return TimeStampsFilter;
}
