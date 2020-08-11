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
import { withTimeStamps } from '../../../gql/relay/mixins/with_timestamps.mixin';
import {
  buildEdgeClass,
  buildConnectionClass
} from '../../../gql/relay/relay_edge_connection.builder';

import { withOrderByFilter } from '../../../gql/relay/mixins/with_order_by_filter.mixin';
import { withPaginationFilter } from '../../../gql/relay/mixins/with_pagination_filter.mixin';
import { withTimeStampsFilter } from '../../../gql/relay/mixins/with_timestamps_filter.mixin';

import { Oid } from '@rumbleship/oid';
import { IQueuedSubscriptionRequest } from '../queued_subscription_request';
import { MaxLength, MinLength, Matches } from 'class-validator';
import { AuthorizerTreatAs, Resource } from '@rumbleship/acl';
import { getRelayPrefix } from '../../inititialize_queued_subscription_relay';
import { withSubscriptionFilter } from '../../with_subscription_filter.mixin';
import { ClassType } from '../../../helpers';
import { WatchList } from '../../watchlist';

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
    @WatchList
    @AuthorizerTreatAs([Resource.User])
    @Field(type => ID, { nullable: true })
    authorized_requestor_id!: string;

    @WatchList
    @Field({ nullable: true })
    marshalled_acl!: string;

    @WatchList
    @MaxLength(MAX_QUERY_STRING_LENGTH)
    @Field({ nullable: !isInputOrObject(attribType) })
    gql_query_string!: string;

    @WatchList
    @MaxLength(MAX_QUERY_STRING_LENGTH)
    @Field({ nullable: true })
    query_attributes?: string;

    @WatchList
    @MaxLength(MAX_OPERATION_NAME_LENGTH)
    @Field({ nullable: true })
    operation_name?: string;
    @WatchList
    @MaxLength(MAX_TOPIC_NAME_LEN)
    @MinLength(MIN_TOPIC_NAME_LEN)
    @Matches(TOPIC_REGEX)
    @Field({ nullable: !isInputOrObject(attribType) })
    publish_to_topic_name!: string;

    @WatchList
    @Field({ nullable: !isInputOrObject(attribType) })
    client_request_uuid!: string;

    @WatchList
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

/***
 * We could create this list off the actual Relay object, but that would project into the schema
 * internal properties suvh as _service. So although it is labourious, we explicitly create the
 * property watch list we want to watch.
 * TODO
 * There is probably some fabulous way of making this all a lot more typesafe,
 * but I really dont have time right now to work that out
 * hints may be here: https://stackoverflow.com/questions/54058699/is-there-a-way-to-dynamically-generate-enums-on-typescript-based-on-object-keys
 * I kind of think we are getting to the point where we may want to make some 'super decorators' that, similar to the buildAttributes builders
 * wrap both the Gql decorators and also the TypescriptSequelize so we can trully have a singular definition of the attributes,
 * with parameters in the super decorator that slects them in and out of the different types...
 * Bit late now.
 */
/*
enum QueuedSubscriptionRequestWatchList {
  authorized_requestor_id = 'authorized_requestor_id',
  marshalled_acl = 'marshalled_acl',
  gql_query_string = 'gql_query_string',
  query_attributes = 'query_attributes',
  operation_name = 'operation_name',
  publish_to_topic_name = 'publish_to_topic_name',
  client_request_uuid = 'client_request_uuid',
  active = 'active',
  updated_at = 'updated_at',
  deleted_at = 'deleted_at'
}
*/

/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
@ArgsType()
export class QueuedSubscriptionRequestFilterForSubscriptions
  extends withSubscriptionFilter(
    withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter),
    `${getRelayPrefix()}QueuedSubscriptionRequestWatchList`
  )
  implements RelayFilterBase<QueuedSubscriptionRequest> {}

