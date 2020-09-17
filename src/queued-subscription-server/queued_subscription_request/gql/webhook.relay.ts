import { ObjectType, Field, ID, InputType, ArgsType } from 'type-graphql';

import {
  Node,
  RelayService,
  RelayInputTypeBase,
  RelayFilterBase,
  NodeServiceOptions
} from '../../../gql/relay/relay.interface';
import { AttribType } from '../../../gql/relay/attrib.enum';

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
import { getRelayPrefix } from '../../inititialize-queued-subscription-relay';
import { withSubscriptionFilter } from '../../../gql/relay/mixins/with-subscription-filter.mixin';
import { withRelayMutationInput } from '../../../gql/relay/relay_mutation';
// eslint-disable-next-line import/no-cycle
import {
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestInput,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequest
} from './queued-subscription-request.relay';
import { buildWebhookBaseAttribs } from './webhook.attribs';
import { ISharedSchema } from '@rumbleship/config';

// We put the service interface here to reduce the circular dependacies between files which blows
// up TS
export interface WebhookService
  extends RelayService<Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate> {
  addWebhook(
    config: ISharedSchema,
    input: WebhookInput,
    opts: NodeServiceOptions
  ): Promise<Webhook>;
  removeWebhook(webhookId: string, opts: NodeServiceOptions): Promise<void>;
  addSubscription(
    webhookId: string,
    input: Partial<QueuedSubscriptionRequestInput>,
    opts: NodeServiceOptions
  ): Promise<QueuedSubscriptionRequest>;
  removeSubscription(
    webhookId: string,
    subscriptionId: string,
    opts: NodeServiceOptions
  ): Promise<Webhook>;
  getWebhookSubscriptionsFor(
    aWebhook: Webhook,
    filter: QueuedSubscriptionRequestFilter,
    opts: NodeServiceOptions
  ): Promise<QueuedSubscriptionRequestConnection>;
}

@ObjectType({ implements: Node, isAbstract: true })
class WebhookConcrete extends buildWebhookBaseAttribs(AttribType.Obj) {}
@ObjectType(`${getRelayPrefix()}Webhook`, { implements: Node })
export class Webhook
  extends withTimeStamps(AttribType.Obj, WebhookConcrete)
  implements Node<Webhook> {
  _service!: WebhookService;
  id!: Oid;
}

@ObjectType(`${getRelayPrefix()}WebhookNotification`)
export class WebhookNotification extends GqlNodeNotification(Webhook) {}

@ObjectType(`${getRelayPrefix()}WebhookEdge`)
export class WebhookEdge extends buildEdgeClass({
  RelayClass: Webhook
}) {}

@ObjectType(`${getRelayPrefix()}WebhookConnection`)
export class WebhookConnection extends buildConnectionClass({
  RelayClass: Webhook,
  EdgeClass: WebhookEdge
}) {}

@InputType(`${getRelayPrefix()}WebhookInput`)
export class WebhookInput
  extends withRelayMutationInput(buildWebhookBaseAttribs(AttribType.Input))
  implements RelayInputTypeBase<unknown> {}

@InputType(`${getRelayPrefix()}WebhookUpdate`)
export class WebhookUpdate
  extends buildWebhookBaseAttribs(AttribType.Update)
  implements RelayInputTypeBase<unknown> {
  // Node id..
  @Field(type => ID)
  id!: string;
}

@ArgsType()
class ConcreteWebhookFilter extends buildWebhookBaseAttribs(AttribType.Arg) {}

@ArgsType()
export class WebhookFilter
  extends withOrderByFilter(withPaginationFilter(withTimeStampsFilter(ConcreteWebhookFilter)))
  implements RelayFilterBase<Webhook> {}
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
@ArgsType()
export class WebhookFilterForSubscriptions
  extends withSubscriptionFilter(
    withTimeStampsFilter(ConcreteWebhookFilter),
    `WebhookWatchList` // note this is called before the server is bootstraped, so no access to config. But that is OK as the enum should be unique within a service
  )
  implements RelayFilterBase<Webhook> {}
