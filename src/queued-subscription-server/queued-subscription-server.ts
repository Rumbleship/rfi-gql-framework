import { QueuedSubscription } from './queued-subscription';
import { GraphQLSchema } from 'graphql';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued_subscription_request/queued_subscription_request';
import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { IterableConnection } from '../gql/relay/iterable-connection.type';
import {
  QueuedSubscriptionRequestService,
  QueuedSubscriptionRequestFilter
} from './queued_subscription_request/gql/queued_subscription_request.relay';

import { getQueuedSubscriptionRequestScopeName } from './inititialize_queued_subscription_relay';
import { Authorizer } from '@rumbleship/acl';
import uuid = require('uuid');
import { IGcpConfig } from '@rumbleship/config';

export class QueuedSubscriptionServer {
  queuedSubscriptions: Map<string, QueuedSubscription> = new Map();
  queuedSubscriptionRequestObserver: QueuedSubscription;
  constructor(public schema: GraphQLSchema, protected config: IGcpConfig) {
    this.queuedSubscriptionRequestObserver = this.initializeRequestObserver(schema);
  }
  /**
   * Setup a subscription to the QueuedSubscriptionRequest model to
   * look for changes to active flag.
   * @param schema
   */
  initializeRequestObserver(schema: GraphQLSchema) {
    const header = Authorizer.createServiceUserAuthHeader();
    const authorizer = Authorizer.make(header, true);
    const marshalled_acl = authorizer.marshalClaims();
    const gql_query_string = `
    subscription {
      onOrdersQueuedSubscriptionRequestChange (  watch_list: [active]) {
        idempotency_key
        node {
          id
          marshalled_acl
          gql_query_string
          active
          authorized_requestor_id
          operation_name
          query_attributes
          publish_to_topic_name
        }
      }
    }
    `;
    const onResponseHook = async (response: SubscriptionResponse) => {
      const changedQueuedRequest: IQueuedSubscriptionRequest =
        response.data?.onOrdersQueuedSubscriptionRequestChange?.node;

      if (changedQueuedRequest && changedQueuedRequest.id) {
        const key = changedQueuedRequest.id.toString();
        await this.removeSubscription(key);
        if (changedQueuedRequest.active) {
          await this.addSubscription(key, changedQueuedRequest).start();
        }
      }
    };

    return new QueuedSubscription(
      schema,
      {
        id: 'qsrObserver',
        authorized_requestor_id: '',
        marshalled_acl,
        gql_query_string,
        publish_to_topic_name: '',
        client_request_uuid: uuid.v4(),
        active: true,
        create_unique_subscription: true, // EVERY instance of this service needs to respond
        onResponseHook
      },
      this.config
    );
  }
  async start(ctx: RumbleshipContext) {
    // Should be an independant promise chain
    // tslint:disable-next-line: no-floating-promises
    this.queuedSubscriptionRequestObserver.start();

    // load up active subscriptions
    const queuedSubscriptionRequestService = ctx.container.get<QueuedSubscriptionRequestService>(
      `${getQueuedSubscriptionRequestScopeName()}Service`
    );
    const filter = new QueuedSubscriptionRequestFilter();
    filter.first = 20;
    filter.active = true;
    const activeSubscriptions = new IterableConnection(filter, async paged_filter => {
      return queuedSubscriptionRequestService.getAll(paged_filter);
    });
    for await (const activeSubscription of activeSubscriptions) {
      const key = activeSubscription.id.toString();

      const queuedSubscription = this.addSubscription(key, activeSubscription);
      // todo add tracing
      // These are independant promise chains
      // tslint:disable-next-line: no-floating-promises
      queuedSubscription.start();
    }
  }

  async stop() {
    await this.queuedSubscriptionRequestObserver.stop();
    await Promise.all(
      Array.from(this.queuedSubscriptions, async queuedSubscription => {
        return queuedSubscription[1].stop();
      })
    );
    this.queuedSubscriptions.clear();
  }

  /**
   * Adds and starts the subscription
   * @param request
   */
  addSubscription(key: string, request: IQueuedSubscriptionRequest) {
    if (this.queuedSubscriptions.has(key)) {
      throw new Error(`QueuedSubscription: ${request.client_request_uuid} already running`);
    }
    const queuedSubscription = new QueuedSubscription(this.schema, request, this.config);

    this.queuedSubscriptions.set(key, queuedSubscription);
    return queuedSubscription;
  }
  async removeSubscription(key: string) {
    const queuedSubscription = this.queuedSubscriptions.get(key);
    if (queuedSubscription) {
      // remove from list first, as await can switch promise chains
      this.queuedSubscriptions.delete(key);
      await queuedSubscription.stop();
    }
  }
}
