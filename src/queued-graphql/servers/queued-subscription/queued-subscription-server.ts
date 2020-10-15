import { GraphQLSchema, printSchema } from 'graphql';
import { hostname } from 'os';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { IQueuedGqlResponse } from '../../interfaces';
import { RfiPubSubSubscription } from '../../shared';
import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { createHash } from 'crypto';
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
    serviced_by
    deleted_at
  }
`;

/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 * TODO: Should we also watch for deleted_at changes and turn paranoid on in the repository?
 *
 *
 */
export const QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL = `
    subscription {
      onQueuedSubscriptionRequestChange {
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
  qsrChangeObserver: RfiPubSubSubscription<QueuedSubscriptionMessage>;
  qsrLocalCacheObserver: RfiPubSubSubscription<NodeChangePayload>;
  queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;

  constructor(protected config: ISharedSchema, public schema: GraphQLSchema) {
    const qsrChangeTopic = `${this.config.PubSub.topicPrefix}_${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}`;
    const qsrChangeSubsciptionName = `${this.config.PubSub.topicPrefix}_${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}`; // Only one instance of the service slistens to this...
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
          // All we do is add it to the cache... the cache will update, and the localCacheObserver will force the update to live subscriptions
          //
          await this.process_incoming_qsrs(ctx, [changedQueuedRequest]);
        }
      }
    );

    return;
  }

  async process_incoming_qsrs(
    ctx: RumbleshipContext,
    incomingQsrs: IQueuedSubscriptionRequest[]
  ): Promise<void> {
    const sequelize = getSequelizeInstance();
    if (sequelize) {
      const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
      try {
        const qsrCache = await loadCache(this.config.Gcp.gaeVersion, { transaction });
        let cache_dirty = false;
        const validateAndAddToCache = (request: IQueuedSubscriptionRequest): void => {
          try {
            QueuedSubscription.validateSubscriptionRequest(this.schema, request);
            qsrCache.add([request]);
            cache_dirty = true;
          } catch (error) {
            // swollow the error
            // TODO Honeycomb determine the type of error and swollow or spit it out
            ctx.logger.log(
              `Couldnt process qsr: ${request.id} in ${
                this.config.serviceName
              }. Error: ${error.toString()}`
            );
          }
        };
        for (const incomingQsr of incomingQsrs) {
          // and only process if we are on the list
          if (
            incomingQsr &&
            incomingQsr.serviced_by?.includes(this.config.serviceName) &&
            incomingQsr.id &&
            incomingQsr.cache_consistency_id
          ) {
            const key = incomingQsr.id.toString();
            const cachedQsr = qsrCache.cache.get(key);
            if (cachedQsr && cachedQsr.cache_consistency_id) {
              if (incomingQsr.deleted_at) {
                qsrCache.cache.delete(key);
              } else {
                if (cachedQsr.cache_consistency_id < incomingQsr.cache_consistency_id) {
                  validateAndAddToCache(incomingQsr);
                } // else ignore
              }
            } else {
              validateAndAddToCache(incomingQsr);
            }
          }
        }
        if (cache_dirty) {
          await saveCache(qsrCache, { transaction });
        }
        await transaction.commit();
      } catch (seqError) {
        // TODO what should be logged?
        ctx.logger.log(`Couldnt Error: ${seqError.toString()}`);
        await transaction.rollback();
      }
    }
  }

  /**
   * Utility to dump out current qsrs... usefull debug tool
   */
  logActiveQsrs(ctx: RumbleshipContext): void {
    ctx.logger.log(`Active Qsrs for ${this.config.serviceName}`);
    for (const [key, qsr] of this.queuedSubscriptions) {
      ctx.logger.log(`   ${key}: ${qsr.cache_consistency_id}`);
    }
  }
  async refreshSubscriptionsFromCache(qsrCache?: QueuedSubscriptionCache): Promise<number> {
    if (!qsrCache) {
      qsrCache = await loadCache(this.config.Gcp.gaeVersion);
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
    const qsrCache = await loadCache(this.config.Gcp.gaeVersion);
    await this.refreshSubscriptionsFromCache(qsrCache);
    await this.initializeCacheChangeObserver();
    // start listening for changes...
    await this.initializeQsrChangeObserver();

    await this.publishSchema(ctx);

    await this.initializeCacheRefreshRequest(ctx);
  }

  async stop(): Promise<void> {
    await this.qsrChangeObserver.stop();
    await this.stopAndClearSubscriptions();
  }

  async stopAndClearSubscriptions(): Promise<void> {
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
    const schemaAsSdl = printSchema(this.schema);
    const schema_hash = createHash('SHA256').update(schemaAsSdl).digest('base64');
    // Note we use a QueuedGqlRequest which calls the mutation on any services that supports this particular
    // mutaion name.
    // We don't care about the response
    this.queuedGqlRequestClient.onResponse({
      client_request_id: `${this.config.serviceName}_updateServiceSchema`,
      handler: async (response: IQueuedGqlResponse, ctx: RumbleshipContext) => {
        ctx.logger.log(`received response to :${this.config.serviceName}_updateServiceSchema`);
      }
    });
    await this.queuedGqlRequestClient.makeRequest(ctx, {
      client_request_id: `${this.config.serviceName}_updateServiceSchema`,
      respond_on_error: true,
      gql_query_string: `mutation updateSchema( $service_name: String!, $schema: String!, $schema_hash: String!) {
        updateServiceSchema(input: {service_name: $service_name, schema: $schema, schema_hash: $schema_hash}) {
          id
        }
      }
      `,
      operation_name: 'updateSchema',
      query_attributes: JSON.stringify({
        service_name: this.config.serviceName,
        schema_hash,
        schema: schemaAsSdl
      })
    });
  }

  async initializeCacheRefreshRequest(ctx: RumbleshipContext): Promise<void> {
    this.queuedGqlRequestClient.onResponse({
      client_request_id: 'GetAllQueuedSubscriptionRequests',
      handler: async (response: IQueuedGqlResponse, ctx: RumbleshipContext) => {
        // We can get a response from multiple services, and google pub sub can
        // deliver it twice.
        if (response.response.data) {
          const qsrs: IQueuedSubscriptionRequest[] = (response.response.data[
            'queuedSubscriptionRequests'
          ].edges as Array<{ node: IQueuedSubscriptionRequest }>).map(entry => entry.node);
          if (qsrs.length) {
            await this.process_incoming_qsrs(ctx, qsrs);
          } else {
            // in development we might clear out the database and so we can get this situation where we have a cache but no
            // real qsrs. This is a special case and we deliberately clear the cache at this and active running queuedSubsctiptions
            // This may be better sorted through a flag in config, but fro now we do it this way
            await this.stopAndClearSubscriptions();
            await saveCache(new QueuedSubscriptionCache(this.config.Gcp.gaeVersion));
          }
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
