import { Field } from 'type-graphql';
import { AttribType } from '../attrib.enum';
import { GqlBaseAttribs } from '../base-attribs.builder';
import { ClassType } from '../../../helpers/classtype';

export function withTimeStamps<TBase extends ClassType<Record<string, any>>>(
  attribType: AttribType,
  Base: TBase
) {
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
