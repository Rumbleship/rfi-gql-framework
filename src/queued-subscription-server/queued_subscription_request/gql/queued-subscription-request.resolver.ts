import { Resolver, Authorized, Arg, Mutation, Query, Args, ID, Root } from 'type-graphql';
import { GQLBaseResolver } from '../../../gql/resolvers/base-resolver';

import { BaseResolverInterface } from '../../../gql/resolvers/base-resolver.interface';
import { RelayService } from '../../../gql/relay/relay.interface';
import { NODE_CHANGE_NOTIFICATION } from '../../../gql/relay/notification-of.enum';

import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { NodeChangePayload } from '../../../app/server/rfi-pub-sub-engine.interface';
import {
  RawPayload,
  createNodeNotification
} from '../../../gql/resolvers/create-node-notification';

import { Service, Inject } from 'typedi';

import {
  QueuedSubscriptionRequest,
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequestNotification,
  QueuedSubscriptionRequestInput,
  QueuedSubscriptionRequestUpdate,
  QueuedSubscriptionRequestFilterForSubscriptions
} from './queued-subscription-request.relay';

import { ResolverPermissions } from '../permissions';
import {
  getRelayPrefixLowerCase,
  isQeuedSubscriptionOidForThisService,
  getQueuedSubscriptionRequestScopeName
} from '../../inititialize-queued-subscription-relay';
import { AddToTrace } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';

import { SubscriptionWatchFilter } from '../../../gql/relay/mixins/with-subscription-filter.mixin';
import { RumbleshipSubscription } from '../../../gql/resolvers/rumbleship-subscription';
import { ClassType } from '../../../helpers';
import { filterBySubscriptionFilter } from '../../../gql/resolvers/filter-by-subscription-filter';

export function buildQueuedSubscriptionRequestResolver(): ClassType<
  BaseResolverInterface<
    QueuedSubscriptionRequest,
    QueuedSubscriptionRequestConnection,
    QueuedSubscriptionRequestFilter,
    QueuedSubscriptionRequestInput,
    QueuedSubscriptionRequestUpdate
  >
> {
  const baseName = `${getRelayPrefixLowerCase()}${getQueuedSubscriptionRequestScopeName()}`;
  const capitalizedName = baseName[0].toUpperCase() + baseName.slice(1);
  @Service()
  @Resolver(resolverOf => QueuedSubscriptionRequest)
  class QueuedSubscriptionRequestResolver
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
        const oid = new Oid(nodePayload.oid);

        if (!isQeuedSubscriptionOidForThisService(oid)) {
          return false;
        }
        return filterBySubscriptionFilter({ payload, args, context });
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
  return QueuedSubscriptionRequestResolver;
}