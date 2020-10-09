import { GraphQLSchema } from 'graphql';
import { hostname } from 'os';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { IQueuedGqlResponse } from '../../interfaces';
import { RfiPubSubSubscription } from '../../shared';
import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
// eslint-disable-next-line import/no-cycle
import {
  loadCache,
  QsrCacheOidScope,
  QueuedSubscriptionCache,
  saveCache
} from '../../queued-subscription-cache';
import { getSequelizeInstance } from '../../../app/server/init-sequelize';
import { QueuedSubscriptionMessage } from './queued-subscription-message';
import { NodeChangePayload } from '../../../app/server/rfi-pub-sub-engine.interface';
import { NODE_CHANGE_NOTIFICATION } from '../../../gql/relay';
import { Oid } from '@rumbleship/oid';

export const QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = `QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC`;

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
    ${QSR_GQL_FRAGMENT}
    `;

export const QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL = `query qsrs {
      queuedSubscriptionRequests(order_by:{ keys: [["cache_consistency_id","ASC"]]}, first: 100 ) {
        edges {
          node {
            ... qsr
          }
        }
      }
    }
    ${QSR_GQL_FRAGMENT}
    `;
export class QueuedSubscriptionServer {
  queuedSubscriptions: Map<string, QueuedSubscription> = new Map();
  in_memory_cache_consistency_id = 0;
  qsrChangeObserver: RfiPubSubSubscription<QueuedSubscriptionMessage>;
  qsrLocalCacheObserver: RfiPubSubSubscription<NodeChangePayload>;
  queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;

  constructor(protected config: ISharedSchema, public schema: GraphQLSchema) {
    const qsrChangeTopic = `${this.config.PubSub.topicPrefix}_${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}`;
    const qsrChangeSubsciptionName = `${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}`; // Only one instance of the service slistens to this...
    const qsrCacheChangeTopicName = `${this.config.PubSub.topicPrefix}_${NODE_CHANGE_NOTIFICATION}_${QsrCacheOidScope}`;
    const qsrCacheChangeSubscriptionName = `${
      this.config.PubSub.topicPrefix
    }_${NODE_CHANGE_NOTIFICATION}_${QsrCacheOidScope}_${hostname()}`; // Each instance recieves this

    const pubsub = new GooglePubSub(this.config.Gcp.Auth);
    this.qsrChangeObserver = new RfiPubSubSubscription<QueuedSubscriptionMessage>(
      this.config,
      pubsub,
      qsrChangeTopic,
      qsrChangeSubsciptionName
    );

    this.qsrLocalCacheObserver = new RfiPubSubSubscription<NodeChangePayload>(
      this.config,
      pubsub,
      qsrCacheChangeTopicName,
      qsrCacheChangeSubscriptionName
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
    this.qsrChangeObserver.start(
      async (response: QueuedSubscriptionMessage, ctx: RumbleshipContext) => {
        const changedQueuedRequest: IQueuedSubscriptionRequest =
          response.subscription_response.data?.[`onQueuedSubscriptionRequestChange`]?.node;
        if (changedQueuedRequest) {
          await this.process_incoming_qsr(ctx, [changedQueuedRequest]);
        }
      }
    );

    return;
  }

  async process_incoming_qsr(
    ctx: RumbleshipContext,
    incomingQsrs: IQueuedSubscriptionRequest[]
  ): Promise<void> {
    const sequelize = getSequelizeInstance();
    if (sequelize) {
      const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
      try {
        const qsrCache = await loadCache({ transaction });
        // Has anotehr instance already saved a later version of the cache?
        if (this.in_memory_cache_consistency_id < qsrCache.highest_cache_consistency_id) {
          try {
            this.in_memory_cache_consistency_id = await this.refreshSubscriptionsFromCache(
              qsrCache
            );
          } catch (error) {
            // cache is out of sync or corrupt, reset it
            qsrCache.clear();
          }
        }
        for (const incomingQsr of incomingQsrs) {
          // todo Add service list to the qsr which is set by the qsr management service
          // and only process if we are on the list
          if (incomingQsr && incomingQsr.id) {
            if (incomingQsr.cache_consistency_id) {
              const key = incomingQsr.id.toString();
              const foundSubscription = this.getSubscription(key);
              if (
                foundSubscription &&
                foundSubscription.cache_consistency_id &&
                incomingQsr.cache_consistency_id &&
                foundSubscription.cache_consistency_id < incomingQsr.cache_consistency_id
              ) {
                try {
                  // only process if it is valid fro this service

                  QueuedSubscription.validateSubscriptionRequest(this.schema, incomingQsr);
                  await this.removeSubscription(key);
                  if (incomingQsr.active) {
                    this.addSubscriptionAndStart(key, incomingQsr);
                  }
                } catch (error) {
                  // swollow the error
                  // TODO determine the type of error and swollow or spit it out
                  ctx.logger.log(
                    `Couldnt process qsr: ${incomingQsr.id} in ${
                      this.config.serviceName
                    }. Error: ${error.toString()}`
                  );
                }
              } else {
                if (!foundSubscription && incomingQsr.active) {
                  // then must be a new one and we must add it
                  this.addSubscriptionAndStart(key, incomingQsr);
                }
              }
              if (this.in_memory_cache_consistency_id < incomingQsr.cache_consistency_id) {
                this.in_memory_cache_consistency_id = incomingQsr.cache_consistency_id;
              }
            }
          }
        }
        // update the cache...
        qsrCache.clear();
        qsrCache.add(Array.from(this.queuedSubscriptions.values()));
        qsrCache.highest_cache_consistency_id = this.in_memory_cache_consistency_id;
        await saveCache(qsrCache, { transaction });
        await transaction.commit();
      } catch (seqError) {
        // TODO what should be logged?
        ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
        await transaction.rollback();
      }
    }
  }
  async refreshSubscriptionsFromCache(qsrCache?: QueuedSubscriptionCache): Promise<number> {
    if (!qsrCache) {
      qsrCache = await loadCache();
    }
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
    return qsrCache.highest_cache_consistency_id;
  }

  async start(ctx: RumbleshipContext): Promise<void> {
    const qsrCache = await loadCache();
    await this.refreshSubscriptionsFromCache(qsrCache);
    await this.initializeCacheChangeObserver();
    // start listening for changes...
    await this.initializeQsrChangeObserver();

    this.queuedGqlRequestClient.onResponse({
      client_request_id: 'GetAllQueuedSubscriptionRequests',
      handler: async (response: IQueuedGqlResponse, ctx: RumbleshipContext) => {
        // We can get a response from multiple services, and google pub sub can
        // deliver it twice.
        if (response.response.data) {
          const qsrs: IQueuedSubscriptionRequest[] = (response.response.data[
            'queuedSubscriptionRequests'
          ].edges as Array<{ node: IQueuedSubscriptionRequest }>).map(entry => entry.node);
          await this.process_incoming_qsr(ctx, qsrs);
        }
        if (response.response.errors) {
          ctx.logger.log(`Error in response: ${response.response.errors.toString()}`);
        }
      }
    });
    // we kick off a floating promise chain here...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queuedGqlRequestClient.start();

    // Add a local_cache model observer so that each instance can reload on change
    // now we make the request
    await this.queuedGqlRequestClient.makeRequest(ctx, {
      client_request_id: 'GetAllQueuedSubscriptionRequests',
      respond_on_error: true,
      gql_query_string: QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL
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

  hasSubscription(key: string): boolean {
    return this.queuedSubscriptions.has(key);
  }

  getSubscription(key: string): QueuedSubscription | undefined {
    return this.queuedSubscriptions.get(key);
  }

  /**
   * Sends the schema and its hash to the QueuedSubscriptionManagement service so that QSR's
   * can be validated before being accepted.
   *
   * When a schema
   */
  async publishSchema(ctx: RumbleshipContext): Promise<void> {
    // const schemaAsSdl = printSchema(this.schema);

    await this.queuedGqlRequestClient.makeRequest(ctx, {
      client_request_id: `${this.config.serviceName}_updateServiceSchema`,
      respond_on_error: false,
      gql_query_string: `
      `
    });
  }

  async initializeCacheChangeObserver(): Promise<void> {
    // we listen directly to NODE_CHANGE_NOTIFICATIONS as the qsr_cache is not a full
    // Relay object
    // HOWEVER each service broadcasts on the channel so we filter out ones genrerated by this
    // service
    await this.qsrLocalCacheObserver.init();

    // kick off on its own promise chain
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.qsrLocalCacheObserver.start(
      async (response: NodeChangePayload, ctx: RumbleshipContext) => {
        // we are very careful on messagees passed in as they may not be what we think they are
        if (response.publisher_service_name === this.config.serviceName) {
          // double check...as messages might not be what we think they should be
          if (response.oid) {
            const { scope } = new Oid(response.oid).unwrap();
            if (scope === QsrCacheOidScope) {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.refreshSubscriptionsFromCache();
            }
          }
        }
      }
    );

    return;
  }
}
