import { Resolver, Authorized, Arg, Mutation, Query, Args, ID, Root } from 'type-graphql';
import {
  GQLBaseResolver,
  BaseResolverInterface,
  RelayService,
  NODE_CHANGE_NOTIFICATION,
  RawPayload,
  RumbleshipContext,
  NodeChangePayload,
  createNodeNotification
} from '../../../';
import { Service, Inject } from 'typedi';

import {
  QueuedSubscriptionRequest,
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequestNotification,
  QueuedSubscriptionRequestInput,
  QueuedSubscriptionRequestUpdate,
  QueuedSubscriptionRequestFilterForSubscriptions
} from './queued_subscription_request.relay';

import { ResolverPermissions } from '../permissions';
import {
  getRelayPrefixLowerCase,
  isQeuedSubscriptionOidForThisService,
  getQueuedSubscriptionRequestScopeName
} from '../../inititialize_queued_subscription_relay';
import { AddToTrace } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';
import { payloadOnWatchList } from '../../payload_on_watch_list';
import { SubscriptionWatchFilter } from '../../with_subscription_filter.mixin';
import { RumbleshipSubscription } from '../../rumbleship_subscription_options';

const baseName = `${getRelayPrefixLowerCase()}${getQueuedSubscriptionRequestScopeName()}`;
const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
@Service()
@Resolver(resolverOf => QueuedSubscriptionRequest)
export class QueuedSubscriptionRequestResolver
  extends GQLBaseResolver<
    QueuedSubscriptionRequest,
    QueuedSubscriptionRequestConnection,
    QueuedSubscriptionRequestFilter,
    QueuedSubscriptionRequestInput,
    QueuedSubscriptionRequestUpdate
  >
  implements
    BaseResolverInterface<
      QueuedSubscriptionRequest,
      QueuedSubscriptionRequestConnection,
      QueuedSubscriptionRequestFilter,
      QueuedSubscriptionRequestInput,
      QueuedSubscriptionRequestUpdate
    > {
  constructor(
    @Inject(`${getQueuedSubscriptionRequestScopeName()}Service`)
    readonly service: RelayService<
      QueuedSubscriptionRequest,
      QueuedSubscriptionRequestConnection,
      QueuedSubscriptionRequestFilter,
      QueuedSubscriptionRequestInput,
      QueuedSubscriptionRequestUpdate
    >
  ) {
    super(service);
  }

  @AddToTrace()
  @Authorized(ResolverPermissions.QueuedSubscriptionRequest.default)
  @Query(type => QueuedSubscriptionRequest, { name: `${baseName}s` })
  async getAll(
    @Args(type => QueuedSubscriptionRequestFilter) filterBy: QueuedSubscriptionRequestFilter
  ): Promise<QueuedSubscriptionRequestConnection> {
    return super.getAll(filterBy);
  }
  @AddToTrace()
  @Authorized(ResolverPermissions.QueuedSubscriptionRequest.default)
  @Query(type => QueuedSubscriptionRequest, { name: `${baseName}` })
  async getOne(@Arg('id', type => ID) id: string): Promise<QueuedSubscriptionRequest> {
    return super.getOne(id);
  }
  @AddToTrace()
  @Authorized(ResolverPermissions.QueuedSubscriptionRequest.default)
  @Mutation(type => QueuedSubscriptionRequest, { name: `add${capitalizedName}` })
  async create(
    @Arg('input', type => QueuedSubscriptionRequestInput) input: QueuedSubscriptionRequestInput
  ): Promise<QueuedSubscriptionRequest> {
    const ctx = this.service.getContext();
    input.marshalled_acl = ctx.authorizer.marshalClaims();
    if (!input.authorized_requestor_id) {
      input.authorized_requestor_id = ctx.authorizer.getUser();
    }
    return super.create(input);
  }
  @AddToTrace()
  @Authorized(ResolverPermissions.QueuedSubscriptionRequest.default)
  @Mutation(type => QueuedSubscriptionRequest, { name: `update${capitalizedName}` })
  async update(
    @Arg('input', type => QueuedSubscriptionRequestUpdate) input: QueuedSubscriptionRequestUpdate
  ): Promise<QueuedSubscriptionRequest> {
    return super.update(input);
  }

  /**
   * A more complex subscription than normal, as we are subscribing to a topic that receives all of the
   * changes to QueuedSubscriptionRequest models across all the the instances of microservices that use
   * this library.
   *
   * @param rawPayload
   *
   * @param args
   */
  @AddToTrace()
  @Authorized(ResolverPermissions.QueuedSubscriptionRequest.default)
  @RumbleshipSubscription(type => QueuedSubscriptionRequestNotification, {
    name: `on${capitalizedName}Change`,
    topics: [`${NODE_CHANGE_NOTIFICATION}_${getQueuedSubscriptionRequestScopeName()}`],
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
      let filter: SubscriptionWatchFilter = {};
      if (args) {
        if (args.id && args.id !== nodePayload.oid) {
          return false;
        }
        if (!payloadOnWatchList(nodePayload, args?.watch_list)) {
          return false;
        }
        const oid = new Oid(nodePayload.oid);
        if (!isQeuedSubscriptionOidForThisService(oid)) {
          return false;
        }

        const { watch_list, ...mutated_filter } = args;
        filter = mutated_filter ?? {};
      }
      const queuedSubscriptionRequestService = context.container.get(
        `${getQueuedSubscriptionRequestScopeName()}Service`
      ) as RelayService<any, any, any, any, any>;

      // remove watch_list from the query to be sent to the Service
      // as it is not handled in the underlying framework findOne... (as you would expect)

      filter.id = nodePayload.oid;
      // Does this match, and are we allowed to see it?
      const node = await queuedSubscriptionRequestService.findOne(filter);
      if (node) {
        return true;
      }
      return false;
    },
    nullable: true
  })
  async onChange(
    @Root() rawPayload: RawPayload,
    @Args() args: QueuedSubscriptionRequestFilterForSubscriptions
  ): Promise<QueuedSubscriptionRequestNotification> {
    return createNodeNotification(rawPayload, this, QueuedSubscriptionRequestNotification);
  }
}
