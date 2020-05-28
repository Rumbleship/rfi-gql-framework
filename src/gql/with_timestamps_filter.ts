import { ClassType } from '../helpers';
import { ArgsType, Field } from 'type-graphql';
import { DateRangeGQL, DateRange } from './daterange.type';

export function withTimeStampsFilter<TBase extends ClassType<any>>(Base: TBase) {
  @ArgsType()
  class TimeStampsFilter extends Base {
    @Field(type => Date, { nullable: true })
    created_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    created_between?: DateRange;

    @Field(type => Date, { nullable: true })
    updated_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    updated_between?: DateRange;

    @Field(type => Date, { nullable: true })
    deleted_at?: Date;

    @Field(type => DateRangeGQL, { nullable: true })
    deleted_between?: DateRange;
  }
  return TimeStampsFilter;
}
