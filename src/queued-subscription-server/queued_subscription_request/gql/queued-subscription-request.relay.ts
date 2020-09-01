import { ObjectType, Field, ID, InputType, ArgsType } from 'type-graphql';

import {
  Node,
  RelayService,
  RelayInputTypeBase,
  RelayFilterBase
} from '../../../gql/relay/relay.interface';
import { AttribType } from '../../../gql/relay/attrib.enum';

import { GqlBaseAttribs, isInputOrObject } from '../../../gql/relay/base-attribs.builder';

import { GqlNodeNotification } from '../../../gql/relay/node-notification.builder';
import { withTimeStamps } from '../../../gql/relay/mixins/with-timestamps.mixin';
import {
  buildEdgeClass,
  buildConnectionClass
} from '../../../gql/relay/relay-edge-connection.builder';

import { withOrderByFilter } from '../../../gql/relay/mixins/with-order-by-filter.mixin';
import { withPaginationFilter } from '../../../gql/relay/mixins/with-pagination-filter.mixin';
import { withTimeStampsFilter } from '../../../gql/relay/mixins/with-timestamps-filter.mixin';

import { Oid } from '@rumbleship/oid';
import { IQueuedSubscriptionRequest } from '../queued-subscription-request';
import { MaxLength, MinLength, Matches } from 'class-validator';
import { AuthorizerTreatAs, Resource } from '@rumbleship/acl';
import { getRelayPrefix } from '../../inititialize-queued-subscription-relay';
import { withSubscriptionFilter } from '../../../gql/relay/mixins/with-subscription-filter.mixin';
import { ClassType } from '../../../helpers';
import { Watchable } from '../../../gql/relay/watchable';

const MAX_QUERY_STRING_LENGTH = 65535;
const MAX_OPERATION_NAME_LENGTH = 2000;
// GOOGLE PUBSUB LIMITS ON TOPIC NAMES: https://cloud.google.com/pubsub/docs/admin#resource_names
const MAX_TOPIC_NAME_LEN = 255;
const MIN_TOPIC_NAME_LEN = 3;
const TOPIC_REGEX = /[A-Za-z0-9-_.~+%]/;

export function buildQueuedSubscriptionRequestBaseAttribs(
  attribType: AttribType
): ClassType<IQueuedSubscriptionRequest> {
  @GqlBaseAttribs(attribType)
  class BaseQueuedSubscriptionRequestAttribs implements IQueuedSubscriptionRequest {
    @Watchable
    @AuthorizerTreatAs([Resource.User])
    @Field(type => ID, { nullable: true })
    authorized_requestor_id!: string;

    @Watchable
    @Field({ nullable: true })
    marshalled_acl!: string;

    @Watchable
    @MaxLength(MAX_QUERY_STRING_LENGTH)
    @Field({ nullable: !isInputOrObject(attribType) })
    gql_query_string!: string;

    @Watchable
    @MaxLength(MAX_QUERY_STRING_LENGTH)
    @Field({ nullable: true })
    query_attributes?: string;

    @Watchable
    @MaxLength(MAX_OPERATION_NAME_LENGTH)
    @Field({ nullable: true })
    operation_name?: string;
    @Watchable
    @MaxLength(MAX_TOPIC_NAME_LEN)
    @MinLength(MIN_TOPIC_NAME_LEN)
    @Matches(TOPIC_REGEX)
    @Field({ nullable: !isInputOrObject(attribType) })
    publish_to_topic_name!: string;

    @Watchable
    @Field({ nullable: !isInputOrObject(attribType) })
    client_request_uuid!: string;

    @Watchable
    @Field(type => Boolean, { nullable: !isInputOrObject(attribType) })
    active!: boolean;
  }
  return BaseQueuedSubscriptionRequestAttribs;
}

// We put the service interface here to reduce the circular dependacies between files which blows
// up TS
export interface QueuedSubscriptionRequestService
  extends RelayService<
    QueuedSubscriptionRequest,
    QueuedSubscriptionRequestConnection,
    QueuedSubscriptionRequestFilter,
    QueuedSubscriptionRequestInput,
    QueuedSubscriptionRequestUpdate
  > {
  createAndCommit(subscriptionControlInput: QueuedSubscriptionRequestInput): Promise<void>;
}

@ObjectType({ implements: Node, isAbstract: true })
class QueuedSubscriptionRequestConcrete extends buildQueuedSubscriptionRequestBaseAttribs(
  AttribType.Obj
) {}
@ObjectType(`${getRelayPrefix()}QueuedSubscriptionRequest`, { implements: Node })
export class QueuedSubscriptionRequest
  extends withTimeStamps(AttribType.Obj, QueuedSubscriptionRequestConcrete)
  implements Node<QueuedSubscriptionRequest> {
  _service!: QueuedSubscriptionRequestService;
  id!: Oid;
}

@ObjectType(`${getRelayPrefix()}QueuedSubscriptionRequestNotification`)
export class QueuedSubscriptionRequestNotification extends GqlNodeNotification(
  QueuedSubscriptionRequest
) {}

@ObjectType(`${getRelayPrefix()}QueuedSubscriptionRequestEdge`)
export class QueuedSubscriptionRequestEdge extends buildEdgeClass({
  RelayClass: QueuedSubscriptionRequest
}) {}

@ObjectType(`${getRelayPrefix()}QueuedSubscriptionRequestConnection`)
export class QueuedSubscriptionRequestConnection extends buildConnectionClass({
  RelayClass: QueuedSubscriptionRequest,
  EdgeClass: QueuedSubscriptionRequestEdge
}) {}

@InputType(`${getRelayPrefix()}QueuedSubscriptionRequestInput`)
export class QueuedSubscriptionRequestInput
  extends buildQueuedSubscriptionRequestBaseAttribs(AttribType.Input)
  implements RelayInputTypeBase<unknown> {}

@InputType(`${getRelayPrefix()}QueuedSubscriptionRequestUpdate`)
export class QueuedSubscriptionRequestUpdate
  extends buildQueuedSubscriptionRequestBaseAttribs(AttribType.Update)
  implements RelayInputTypeBase<unknown> {
  // Node id..
  @Field(type => ID)
  id!: string;
}

@ArgsType()
class ConcreteQueuedSubscriptionRequestFilter extends buildQueuedSubscriptionRequestBaseAttribs(
  AttribType.Arg
) {}

@ArgsType()
export class QueuedSubscriptionRequestFilter
  extends withOrderByFilter(
    withPaginationFilter(withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter))
  )
  implements RelayFilterBase<QueuedSubscriptionRequest> {}
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
@ArgsType()
export class QueuedSubscriptionRequestFilterForSubscriptions
  extends withSubscriptionFilter(
    withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter),
    `QueuedSubscriptionRequestWatchList` // note this is called before the server is bootstraped, so no access to config. But that is OK as the enum should be unique within a service
  )
  implements RelayFilterBase<QueuedSubscriptionRequest> {}
