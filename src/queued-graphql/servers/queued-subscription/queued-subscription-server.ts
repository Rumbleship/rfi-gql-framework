import { GraphQLSchema } from 'graphql';

import { RumbleshipContext } from '../../../app/rumbleship-context';
import { Authorizer } from '@rumbleship/acl';
import uuid = require('uuid');
import { ISharedSchema } from '@rumbleship/config';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { IQueuedGqlResponse } from '../../interfaces';

export class QueuedSubscriptionServer {
  queuedSubscriptions: Map<string, QueuedSubscription> = new Map();
  queuedSubscriptionRequestObserver: QueuedSubscription;
  queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;
  constructor( protected config: ISharedSchema, public schema: GraphQLSchema) {
    this.queuedSubscriptionRequestObserver = this.initializeRequestObserver(schema);
    this.queuedGqlRequestClient = new QueuedGqlRequestClientOneInstanceResponder(config);
  }
  /**
   * Setup a subscription to the QueuedSubscriptionRequest model to
   * look for changes to active flag.
   * @param schema
   */
  initializeRequestObserver(schema: GraphQLSchema): QueuedSubscription {
    const header = Authorizer.createServiceUserAuthHeader();
    const authorizer = Authorizer.make(header, true);
    const marshalled_acl = authorizer.marshalClaims();
    const gql_query_string = `
    subscription {
      onQueuedSubscriptionRequestChange (  watch_list: [active]) {
        idempotency_key
        node {
          id
          marshalled_acl
          gql_query_string
          active
          owner_id
          operation_name
          query_attributes
          publish_to_topic_name
        }
      }
    }
    `;
    const onResponseHook = async (response: SubscriptionResponse) => {
      const changedQueuedRequest: IQueuedSubscriptionRequest =
        response.data?.[`onQueuedSubscriptionRequestChange`]?.node;
      // TODO validate that this service's schema can parse and execute the gql document
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
        owner_id: '',
        marshalled_acl,
        gql_query_string,
        publish_to_topic_name: '',
        subscription_name: uuid.v4(),
        active: true,
        create_unique_subscription: true, // EVERY instance of this service needs to respond, so a unique subscription name is assigned to each instance
        onResponseHook
      },
      this.config.Gcp
    );
  }
  async start(ctx: RumbleshipContext): Promise<void> {
    // Should be an independant promise chain
    // start listening for changes...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queuedSubscriptionRequestObserver.start();
    this.queuedGqlRequestClient.onResponse({
      client_request_id: 'BroadcastActiveQueuedSubscriptions',
      handler: async (response: IQueuedGqlResponse, ctx: RumbleshipContext) => {
        // We can get a response from multiple services, and google pub sub can
        // deliver it twice.
        // We actually don't care about the response, as we call a mutation to force a broadcast of the
        // QSR's in the main store
        // This should only happen in development, as we suppress errors in production
        //
        if (response.response.errors) {
          ctx.logger.log('Error in response');
        }
      }
    });
    // we kick off a floating promise chain here...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queuedGqlRequestClient.start();
    // now we make the request

    /*
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

      const queuedSubscription = this.addSubscription(
        key,
        activeSubscription as IQueuedSubscriptionRequest
      );
      // todo add tracing
      // These are independant promise chains
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      queuedSubscription.start();
    }
    */
  }

  async stop(): Promise<void> {
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
  addSubscription(key: string, request: IQueuedSubscriptionRequest): QueuedSubscription {
    if (this.queuedSubscriptions.has(key)) {
      throw new Error(
        `QueuedSubscription: id: ${key}, Name: ${request.subscription_name} already running`
      );
    }
    const queuedSubscription = new QueuedSubscription(this.schema, request, this.config.Gcp);

    this.queuedSubscriptions.set(key, queuedSubscription);
    return queuedSubscription;
  }
  async removeSubscription(key: string): Promise<void> {
    const queuedSubscription = this.queuedSubscriptions.get(key);
    if (queuedSubscription) {
      // remove from list first, as await can switch promise chains
      this.queuedSubscriptions.delete(key);
      await queuedSubscription.stop();
    }
  }
}
