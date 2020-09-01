import { ArgsType, Field, Int, ID } from 'type-graphql';
import { Min } from 'class-validator';
import { ClassType } from '../../../helpers/classtype';

export function withPaginationFilter<TFilterBase extends ClassType<object>>(Base: TFilterBase) {
  @ArgsType()
  class ConnectionFilter extends Base {
    @Field(type => Int, { nullable: true })
    @Min(0)
    first?: number; // max number to return

    @Field({ nullable: true })
    after?: string; // opaque cursor -

    @Field(type => Int, { nullable: true })
    @Min(0)
    last?: number; // max number to return

    @Field({ nullable: true })
    before?: string; // opaque cursor -

    @Field(type => ID, { nullable: true })
    id?: string;
  }
  return ConnectionFilter;
}
