import {
  Resolver,
  Authorized,
  Arg,
  Mutation,
  Query,
  Args,
  ID,
  Root,
  InputType,
  Field,
  FieldResolver,
  ObjectType,
  Ctx
} from 'type-graphql';
import { ISharedSchema } from '@rumbleship/config';
import { GQLBaseResolver } from '../../../gql/resolvers/base-resolver';

import { BaseResolverInterface } from '../../../gql/resolvers/base-resolver.interface';

import { NODE_CHANGE_NOTIFICATION } from '../../../gql/relay/notification-of.enum';

import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { NodeChangePayload } from '../../../app/server/rfi-pub-sub-engine.interface';
import {
  RawPayload,
  createNodeNotification
} from '../../../gql/resolvers/create-node-notification';

import { Service, Inject } from 'typedi';

import {
  Webhook,
  WebhookConnection,
  WebhookFilter,
  WebhookNotification,
  WebhookInput,
  WebhookUpdate,
  WebhookFilterForSubscriptions,
  WebhookService
} from './webhook.relay';

import { ResolverPermissions } from '../../permissions';
import {
  getRelayPrefixLowerCase,
  getWebhookScopeName,
  isWebhookOidForThisService
} from '../../inititialize-queued-subscription-relay';
import { AddToTrace } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';

import { SubscriptionWatchFilter } from '../../../gql/relay/mixins/with-subscription-filter.mixin';
import { RumbleshipSubscription } from '../../../gql/resolvers/rumbleship-subscription';
import { ClassType } from '../../../helpers';
import { filterBySubscriptionFilter } from '../../../gql/resolvers/filter-by-subscription-filter';
import {
  withRelayMutationInput,
  Empty,
  withRelayMutationPayload,
  setClientMutationIdOnPayload
} from '../../../gql/relay/relay_mutation';

import {
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequestInput,
  WebhookSubscription
} from '../../queued_subscription_request/gql';

import { AuthorizerTreatAs, Resource } from '@rumbleship/acl';

@ObjectType()
export class AddWebhookPayload extends withRelayMutationPayload(Empty) {
  @Field(type => Webhook)
  webhook!: Webhook;
}
@InputType()
export class AddWebhookInput extends withRelayMutationInput(Empty) {
  @AuthorizerTreatAs([Resource.Division])
  @Field(type => ID, { nullable: false })
  system_id!: string;

  @Field({ nullable: false })
  subscription_url!: string;
}
@ObjectType()
export class RemoveWebhookPayload extends withRelayMutationPayload(Empty) {}

@InputType()
export class AddSubscriptionInput
  extends withRelayMutationInput(Empty)
  implements Partial<QueuedSubscriptionRequestInput> {
  @Field(type => ID, { nullable: false })
  webhook_id!: string;

  @Field({ nullable: false })
  gql_query_string!: string;

  @Field({ nullable: true })
  query_attributes?: string;

  @Field({ nullable: true })
  operation_name?: string;

  @Field({ nullable: true })
  client_request_uuid!: string;

  @Field(type => Boolean, { nullable: false })
  active!: boolean;
}
@ObjectType()
export class AddSubscriptionPayload extends withRelayMutationPayload(Empty) {
  @Field(type => WebhookSubscription)
  webhookSubscription!: WebhookSubscription;
}

@InputType()
export class RemoveSubscriptionInput extends withRelayMutationInput(Empty) {
  @Field(type => ID, { nullable: false })
  webhookId!: string;
  @Field(type => ID, { nullable: false })
  subscriptionId!: string;
}
@ObjectType()
export class RemoveSubscriptionPayload extends withRelayMutationPayload(Empty) {
  @Field(type => Webhook)
  webhook!: Webhook;
}

@InputType()
export class RemoveWebhookInput extends withRelayMutationInput(Empty) {
  @Field(type => ID, { nullable: false })
  webhookId!: string;
}

export function buildWebhookResolver(
  config: ISharedSchema
): ClassType<
  BaseResolverInterface<Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate>
> {
  const baseName = `${getRelayPrefixLowerCase()}${getWebhookScopeName()}`;
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Service()
  @Resolver(resolverOf => Webhook)
  class WebhookResolver
    extends GQLBaseResolver<Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate>
    implements
      BaseResolverInterface<
        Webhook,
        WebhookConnection,
        WebhookFilter,
        WebhookInput,
        WebhookUpdate
      > {
    constructor(
      @Inject(`${getWebhookScopeName()}Service`)
      readonly service: WebhookService
    ) {
      super(service);
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Query(type => WebhookConnection, { name: `${baseName}s` })
    async getAll(@Args(type => WebhookFilter) filterBy: WebhookFilter): Promise<WebhookConnection> {
      return super.getAll(filterBy);
    }
    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Query(type => Webhook, { name: `${baseName}` })
    async getOne(@Arg('id', type => ID) id: string): Promise<Webhook> {
      return super.getOne(id);
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Mutation(type => AddWebhookPayload, { name: `add${capitalizedName}` })
    async addWebhook(
      @Arg('input', type => AddWebhookInput) input: AddWebhookInput
    ): Promise<AddWebhookPayload> {
      return setClientMutationIdOnPayload(input, async () => {
        const addWebhookPayload = new AddWebhookPayload();
        addWebhookPayload.webhook = await this.service.addWebhook(config, input, {});
        return addWebhookPayload;
      });
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Mutation(type => RemoveWebhookPayload, {
      description: 'warning: not completely implemented. deactivate associated qsrs manually',
      name: `remove${capitalizedName}`
    })
    async removeWebhook(
      @Arg('input', type => RemoveWebhookInput) input: RemoveWebhookInput
    ): Promise<RemoveWebhookPayload> {
      return setClientMutationIdOnPayload(input, async () => {
        const removeWebhookPayload = new RemoveWebhookPayload();
        await this.service.removeWebhook(input.webhookId, {});
        return removeWebhookPayload;
      });
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Mutation(type => AddSubscriptionPayload, { name: `add${capitalizedName}Subscription` })
    async addSubscription(
      @Arg('input', type => AddSubscriptionInput) input: AddSubscriptionInput
    ): Promise<AddSubscriptionPayload> {
      return setClientMutationIdOnPayload(input, async () => {
        const addSubscriptionPayload = new AddSubscriptionPayload();
        const { webhook_id, ...subscriptionInput } = input;
        addSubscriptionPayload.webhookSubscription = await this.service.addSubscription(
          webhook_id,
          subscriptionInput,
          {}
        );
        return addSubscriptionPayload;
      });
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @Mutation(type => RemoveSubscriptionPayload, {
      name: `remove${capitalizedName}SubscriptionFor`
    })
    async removeSubscription(
      @Arg('input', type => RemoveSubscriptionInput) input: RemoveSubscriptionInput
    ): Promise<RemoveSubscriptionPayload> {
      return setClientMutationIdOnPayload(input, async () => {
        const removesubscriptionPayload = new RemoveSubscriptionPayload();
        removesubscriptionPayload.webhook = await this.service.removeSubscription(
          input.webhookId,
          input.subscriptionId,
          {}
        );
        return removesubscriptionPayload;
      });
    }

    /**
     * A more complex subscription than normal, as we are subscribing to a topic that receives all of the
     * changes to Webhook models across all the the instances of microservices that use
     * this library.
     *
     * @param rawPayload
     *
     * @param args
     */
    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @RumbleshipSubscription(type => WebhookNotification, {
      name: `on${capitalizedName}Change`,
      topics: [`${NODE_CHANGE_NOTIFICATION}_${getWebhookScopeName()}`],
      filter: async ({
        payload,
        args,
        context
      }: {
        payload: RawPayload;
        args?: SubscriptionWatchFilter;
        context: RumbleshipContext;
      }) => {
        const nodePayload: NodeChangePayload = JSON.parse(payload.data.toString());
        const oid = new Oid(nodePayload.oid);

        if (!isWebhookOidForThisService(oid)) {
          return false;
        }
        return filterBySubscriptionFilter({ payload, args, context });
      },
      nullable: true
    })
    async onChange(
      @Root() rawPayload: RawPayload,
      @Args() args: WebhookFilterForSubscriptions
    ): Promise<WebhookNotification> {
      return createNodeNotification(rawPayload, this, WebhookNotification);
    }

    @AddToTrace()
    @Authorized(ResolverPermissions.Webhook.default)
    @FieldResolver(type => QueuedSubscriptionRequestConnection)
    async webhookSubscriptions(
      @Ctx() ctx: RumbleshipContext,
      @Root() aWebhook: Webhook,
      @Args(type => QueuedSubscriptionRequestFilter) filter: QueuedSubscriptionRequestFilter
    ): Promise<QueuedSubscriptionRequestConnection> {
      return this.service.getWebhookSubscriptionsFor(aWebhook, filter, {});
    }
  }
  return WebhookResolver;
}
