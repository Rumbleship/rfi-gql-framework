import { QueuedSubscription } from './queued-subscription';
import { GraphQLSchema } from 'graphql';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued_subscription_request/queued-subscription-request.interface';
import { RumbleshipContext } from '../app/rumbleship-context/rumbleship-context';
import { IterableConnection } from '../gql/relay/iterable-connection.type';
import {
  QueuedSubscriptionRequestService,
  QueuedSubscriptionRequestFilter
} from './queued_subscription_request/gql/queued-subscription-request.relay';

import {
  getQueuedSubscriptionRequestScopeName,
  getRelayPrefixLowerCase,
  getWebhookScopeName
} from './inititialize-queued-subscription-relay';
import { Authorizer } from '@rumbleship/acl';
import uuid = require('uuid');
import { IGcpConfig } from '@rumbleship/config';
import { WebhookFilter, WebhookService } from './webhook';
import { gcpCreatePushSubscription, gcpGetTopic } from './helpers';
import { PubSub as GooglePubsub } from '@google-cloud/pubsub';

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
  initializeRequestObserver(schema: GraphQLSchema): QueuedSubscription {
    const header = Authorizer.createServiceUserAuthHeader();
    const authorizer = Authorizer.make(header, true);
    const marshalled_acl = authorizer.marshalClaims();
    const baseName = `${getRelayPrefixLowerCase()}`;

    const capitalizedName = baseName ? baseName[0].toUpperCase() + baseName.slice(1) : '';

    const gql_query_string = `
    subscription {
      on${capitalizedName}QueuedSubscriptionRequestChange (  watch_list: [active]) {
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
        owner_id: '',
        marshalled_acl,
        gql_query_string,
        publish_to_topic_name: '',
        subscription_name: uuid.v4(),
        active: true,
        create_unique_subscription: true, // EVERY instance of this service needs to respond
        onResponseHook
      },
      this.config
    );
  }
  async start(ctx: RumbleshipContext): Promise<void> {
    // Should be an independant promise chain
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queuedSubscriptionRequestObserver.start();

    // Make sure any webhooks are setup on gcloud..
    await this.validateWebhooksSetup(ctx);
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

  async validateWebhooksSetup(ctx: RumbleshipContext): Promise<void> {
    const webhookService = ctx.container.get<WebhookService>(`${getWebhookScopeName()}Service`);
    const filter = new WebhookFilter();
    filter.first = 20;
    const activeWebhooks = new IterableConnection(filter, async paged_filter => {
      return webhookService.getAll(paged_filter);
    });

    for await (const webhook of activeWebhooks) {
      if (webhook.topic_name && webhook.gcloud_subscription) {
        try {
          const gcloudPubSub = new GooglePubsub(this.config.Auth);
          const topic = await gcpGetTopic(gcloudPubSub, webhook.topic_name);
          await gcpCreatePushSubscription(
            topic,
            webhook.gcloud_subscription,
            webhook.subscription_url,
            'pubsub@rfi-development.iam.gserviceaccount.com'
          );
        } catch (error) {
          const ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
          if (error.code !== ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
            ctx.logger.error(
              `Webhook: ${webhook.id.toString()} failed to validate topic/subscription`,
              { error }
            );
          }
        }
      }
    }
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
    const queuedSubscription = new QueuedSubscription(this.schema, request, this.config);

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
