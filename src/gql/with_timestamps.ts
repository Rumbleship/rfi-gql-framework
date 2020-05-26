import { DateRange, DateRangeGQL } from './daterange.type';
import { ClassType } from '../helpers';
import { AttribType } from './attrib.enum';
import { GqlBaseAttribs } from './gql_helpers';
import { Field, ArgsType } from 'type-graphql';

export function withTimeStamps<TBase extends ClassType<any>>(attribType: AttribType, Base: TBase) {
  @GqlBaseAttribs(attribType)
  class TimeStampedGQL extends Base {
    @Field(type => Date, { nullable: true })
    created_at?: Date;

    @Field(type => Date, { nullable: true })
    updated_at?: Date;

    @Field(type => Date, { nullable: true })
    deleted_at?: Date;
  }
  return TimeStampedGQL;
}

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
