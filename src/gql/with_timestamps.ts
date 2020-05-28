import { ClassType } from '../helpers';
import { AttribType } from './attrib.enum';
import { GqlBaseAttribs } from './gql_helpers';
import { Field } from 'type-graphql';

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
