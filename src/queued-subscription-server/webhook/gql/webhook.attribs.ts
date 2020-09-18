import { AuthorizerTreatAs, Resource } from '@rumbleship/acl';
import { Field, ID } from 'type-graphql';
import { GqlBaseAttribs, isInputOrObject } from '../../../gql/relay/base-attribs.builder';

import { AttribType } from '../../../gql/relay/attrib.enum';
import { Watchable } from '../../../gql/relay/watchable';
import { ClassType } from '../../../helpers/classtype';
import { MaxLength, MinLength } from 'class-validator';

/**
 * Required because the builder needs to be correctly typed, as this is a library and
 * a .d.ts file is auytomatically created, which means the contents of the resultant classtype
 * returned needs to be explicit.
 *
 */
export interface WebhookBase {
  owner_id: string;
  subscription_url: string;
  gclound_subscription?: string;
  topic_name?: string;
  active?: boolean;
}
export function buildWebhookBaseAttribs(attribType: AttribType): ClassType<WebhookBase> {
  @GqlBaseAttribs(attribType)
  class BaseWebhookAttribs implements WebhookBase {
    @Watchable
    @AuthorizerTreatAs([Resource.Division, Resource.User])
    @Field(type => ID, { description: 'Rumbleship provided owner_id/divsion_id', nullable: true })
    owner_id!: string;
    @Watchable
    @Field({ nullable: true })
    subscription_url!: string;

    @Watchable
    @MaxLength(255)
    @MinLength(3)
    @Field({ nullable: true })
    gclound_subscription?: string;

    @MaxLength(255)
    @MinLength(3)
    @Field({ nullable: true })
    topic_name?: string;

    @Watchable
    @Field(type => Boolean, { nullable: !isInputOrObject(attribType) })
    active!: boolean;
  }
  return BaseWebhookAttribs;
}
