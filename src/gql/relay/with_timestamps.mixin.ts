import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';

import { Field } from 'type-graphql';
import { GqlBaseAttribs } from './base-attribs.builder';

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
