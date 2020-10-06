import { GraphQLSchema } from 'graphql';
import { hostname } from 'os';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { IQueuedGqlResponse } from '../../interfaces';
import { RfiPubSubSubscription } from '../../shared';
import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
// eslint-disable-next-line import/no-cycle
import { loadCache, QueuedSubscriptionCache, saveCache } from '../../queued-subscription-cache';
import { getSequelizeInstance } from '../../../app/server/init-sequelize';

export const QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = 'QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC';

export const QSR_GQL_FRAGMENT = `
  fragment qsr on QueuedSubscriptionRequest {
    id
    cache_consistency_id
    marshalled_acl
    gql_query_string
    active
    owner_id
    operation_name
    query_attributes
    publish_to_topic_name

  }
`;

/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 */
export const QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = `
    subscription {
      onQueuedSubscriptionRequestChange (  watch_list: [active]) {
        idempotency_key
        node {
          ... qsr
        }
      }
    }
    `;

export class QueuedSubscriptionServer {
  queuedSubscriptions: Map<string, QueuedSubscription> = new Map();
  in_memory_cache_consistency_id = 0;
  qsrChangeObserver: RfiPubSubSubscription<SubscriptionResponse>;
  queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;

  constructor(protected config: ISharedSchema, public schema: GraphQLSchema) {
    this.qsrChangeObserver = new RfiPubSubSubscription<SubscriptionResponse>(
      this.config,
      new GooglePubSub(this.config.Gcp.Auth),
      QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC,
      `${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}_${hostname()}` // Every instance needs to update its cache.
    );
    this.queuedGqlRequestClient = new QueuedGqlRequestClientOneInstanceResponder(config);
  }
  /**
   * Setup a subscription to the QueuedSubscriptionRequest model to
   * look for changes to active flag.
   * @param schema
   */
  async initializeQsrChangeObserver(): Promise<void> {
    await this.qsrChangeObserver.init();

    // kick off on its own promise chain
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.qsrChangeObserver.start(async (response: SubscriptionResponse, ctx: RumbleshipContext) => {
      const changedQueuedRequest: IQueuedSubscriptionRequest =
        response.data?.[`onQueuedSubscriptionRequestChange`]?.node;
      if (changedQueuedRequest && changedQueuedRequest.id) {
        if (changedQueuedRequest.cache_consistency_id) {
          const sequelize = getSequelizeInstance();
          if (sequelize) {
            const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
            try {
              const qsrCache = await loadCache({ transaction });
              // Has anotehr instance already saved a later version of the cache?
              if (this.in_memory_cache_consistency_id < qsrCache.highest_cache_consistency_id) {
                await this.refreshSubscriptionsFromCache(qsrCache);
              }
              if (
                qsrCache.highest_cache_consistency_id < changedQueuedRequest.cache_consistency_id
              ) {
                try {
                  QueuedSubscription.validateSubscriptionRequest(this.schema, changedQueuedRequest);

                  const key = changedQueuedRequest.id.toString();
                  await this.removeSubscription(key);
                  if (changedQueuedRequest.active) {
                    this.addSubscriptionAndStart(key, changedQueuedRequest);
                  }
                } catch (error) {
                  // swollow the error
                  // TODO determine the type of error and swollow or spit it out
                  ctx.logger.log(
                    `Couldnt process qsr in ${this.config.serviceName}. Error: ${error.toString()}`
                  );
                }
                // update the cache...
                qsrCache.clear();
                qsrCache.highest_cache_consistency_id = changedQueuedRequest.cache_consistency_id;
                qsrCache.add(Array.from(this.queuedSubscriptions.values()));
                await saveCache(qsrCache, { transaction });
                this.in_memory_cache_consistency_id = qsrCache.highest_cache_consistency_id;
                await transaction.commit();
              }
            } catch (seqError) {
              // TODO what should be logged?
              ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
              await transaction.rollback();
            }
          }
        }
      }
    });

    return;
  }

  async refreshSubscriptionsFromCache(qsrCache: QueuedSubscriptionCache): Promise<void> {
    this.in_memory_cache_consistency_id = qsrCache.highest_cache_consistency_id;
    // find active subscriptions that need to be removed
    for (const [key] of this.queuedSubscriptions.entries()) {
      if (!qsrCache.cache.has(key)) {
        await this.removeSubscription(key);
      }
    }
    // find qsr's that have to be added
    for (const [key, qsr] of qsrCache.cache.entries()) {
      if (!this.queuedSubscriptions.has(key)) {
        this.addSubscriptionAndStart(key, qsr);
      }
    }
  }

  async start(ctx: RumbleshipContext): Promise<void> {
    // Should be an independant promise chain
    // start listening for changes...
    await this.initializeQsrChangeObserver();

    this.queuedGqlRequestClient.onResponse({
      client_request_id: 'PublishQueuedSubscriptions',
      handler: async (response: IQueuedGqlResponse, ctx: RumbleshipContext) => {
        // We can get a response from multiple services, and google pub sub can
        // deliver it twice.
        if (response.response.errors) {
          ctx.logger.log(`Error in response: ${response.response.errors.toString()}`);
        }
      }
    });
    // we kick off a floating promise chain here...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queuedGqlRequestClient.start();

    // now we make the request
    await this.queuedGqlRequestClient.makeRequest(ctx, {
      client_request_id: 'PublishQueuedSubscriptions',
      respond_on_error: false,
      gql_query_string: `query {}`
    });
  }

  async stop(): Promise<void> {
    await this.qsrChangeObserver.stop();
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
  addSubscriptionAndStart(key: string, request: IQueuedSubscriptionRequest): QueuedSubscription {
    if (this.queuedSubscriptions.has(key)) {
      throw new Error(
        `QueuedSubscription: id: ${key}, Name: ${request.subscription_name} already running`
      );
    }
    const queuedSubscription = new QueuedSubscription(this.schema, request, this.config.Gcp);

    this.queuedSubscriptions.set(key, queuedSubscription);
    // start it asynchonously
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void queuedSubscription.start();
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
