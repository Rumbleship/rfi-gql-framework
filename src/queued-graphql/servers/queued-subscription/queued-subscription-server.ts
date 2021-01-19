import { GraphQLSchema, printError, printSchema } from 'graphql';
import { hostname } from 'os';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientSingleInstanceResponder } from '../../clients/gql-request/queued-gql-request-client';
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
import { AddToTrace } from '@rumbleship/o11y';
import { Transaction } from 'sequelize/types';

export const QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = `QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC`;

export const QSR_GQL_FRAGMENT = `
  fragment qsr on QueuedSubscriptionRequest {
    id
    subscription_name
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

function buildPrimeQsrCacheListQuery(
  { first, after }: { first: number; after?: string } = { first: 100 }
): string {
  return `query qsrs {
        queuedSubscriptionRequests(
          order_by: { keys: [["cache_consistency_id", "ASC"]] }
          first: ${first}
          after: "${after ?? ''}"
        ) {
          edges {
            node {
              ...qsr
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      },
      ${QSR_GQL_FRAGMENT},
    `;
}
export class QueuedSubscriptionServer {
  queuedSubscriptions: Map<string, QueuedSubscription> = new Map();
  qsrChangeObserver: RfiPubSubSubscription<QueuedSubscriptionMessage>;
  qsrLocalCacheObserver: RfiPubSubSubscription<NodeChangePayload>;
  queuedGqlRequestClient: QueuedGqlRequestClientSingleInstanceResponder;

  constructor(protected config: ISharedSchema, public schema: GraphQLSchema) {
    const qsrChangeTopic = `${this.config.PubSub.topicPrefix}_${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}`;
    const qsrChangeSubsciptionName = `${this.config.PubSub.topicPrefix}_${QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC}_${config.serviceName}`; // Only one instance of the service slistens to this...
    const qsrCacheChangeTopicName = `${this.config.PubSub.topicPrefix}_${NODE_CHANGE_NOTIFICATION}_${QsrCacheOidScope}`;
    const qsrCacheChangeSubscriptionName = `${
      this.config.PubSub.topicPrefix
    }_${NODE_CHANGE_NOTIFICATION}_${QsrCacheOidScope}_${config.serviceName}.${
      config.Gcp.gaeVersion
    }.${hostname()}`; // Each instance recieves this

    const pubsub = new GooglePubSub(this.config.Gcp.Auth);
    pubsub.projectId = pubsub.projectId.replace('-private', '-public');
    this.qsrChangeObserver = new RfiPubSubSubscription<QueuedSubscriptionMessage>(
      this.config,
      pubsub,
      qsrChangeTopic,
      qsrChangeSubsciptionName,
      false
    );

    this.qsrLocalCacheObserver = new RfiPubSubSubscription<NodeChangePayload>(
      this.config,
      pubsub,
      qsrCacheChangeTopicName,
      qsrCacheChangeSubscriptionName,
      true // delete_on_stop
    );

    this.queuedGqlRequestClient = new QueuedGqlRequestClientSingleInstanceResponder(config);
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
      async (ctx: RumbleshipContext, response: QueuedSubscriptionMessage): Promise<void> => {
        await this.handler_onQueuedSubscriptionRequestChange(ctx, response);
      }
    );

    return;
  }

  @AddToTrace()
  async process_incoming_qsrs(
    ctx: RumbleshipContext,
    incomingQsrs: IQueuedSubscriptionRequest[]
  ): Promise<void> {
    const sequelize = getSequelizeInstance();
    if (sequelize) {
      const transaction = await sequelize.transaction(); // we want to lock the cache for writing, so create a transaction
      try {
        const qsrCache = await this.loadCache(ctx, this.config.Gcp.gaeVersion, { transaction });
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
          /**
           *  @note open question: else should clear anything in the cache that is
           * *not* in the list of incoming QSRs?
           */
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

  @AddToTrace()
  async refreshSubscriptionsFromCache(
    ctx: RumbleshipContext,
    qsrCache?: QueuedSubscriptionCache
  ): Promise<number> {
    if (!qsrCache) {
      qsrCache = await this.loadCache(ctx, this.config.Gcp.gaeVersion);
    }
    // find active subscriptions that need to be removed
    for (const [key, queued] of this.queuedSubscriptions.entries()) {
      const cachedSubscription = qsrCache.cache.get(key);
      if (
        !cachedSubscription ||
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        queued.cache_consistency_id! < cachedSubscription.cache_consistency_id!
      ) {
        await this.removeSubscription(ctx, key);
      }
    }
    // find qsr's that have to be added
    for (const [key, qsr] of qsrCache.cache.entries()) {
      if (!this.queuedSubscriptions.has(key)) {
        this.addSubscriptionAndStart(ctx, key, qsr);
      }
    }
    return qsrCache.highest_cache_consistency_id;
  }

  @AddToTrace()
  async start(ctx: RumbleshipContext): Promise<void> {
    const qsrCache = await this.loadCache(ctx, this.config.Gcp.gaeVersion);
    await this.refreshSubscriptionsFromCache(ctx, qsrCache);
    await this.initializeCacheChangeObserver(ctx);
    // start listening for changes... kicks off its own
    await this.initializeQsrChangeObserver();

    await this.publishSchema(ctx);

    await this.initializeCacheRefreshRequest(ctx);
  }

  @AddToTrace()
  async stop(ctx: RumbleshipContext): Promise<void> {
    await this.qsrChangeObserver.stop();
    await this.qsrLocalCacheObserver.stop();
    await this.stopAndClearSubscriptions(ctx);
  }

  @AddToTrace()
  async stopAndClearSubscriptions(ctx: RumbleshipContext): Promise<void> {
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
  @AddToTrace()
  addSubscriptionAndStart(
    ctx: RumbleshipContext,
    key: string,
    request: IQueuedSubscriptionRequest
  ): QueuedSubscription {
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

  @AddToTrace()
  async removeSubscription(ctx: RumbleshipContext, key: string): Promise<void> {
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
  @AddToTrace()
  async publishSchema(ctx: RumbleshipContext): Promise<void> {
    const schemaAsSdl = printSchema(this.schema);
    const schema_hash = createHash('SHA256').update(schemaAsSdl).digest('base64');
    // Note we use a QueuedGqlRequest which calls the mutation on any services that supports this particular
    // mutaion name.
    // We don't care about the response
    this.queuedGqlRequestClient.onResponse({
      client_request_id: `${this.config.serviceName}_updateServiceSchema`,
      handler: async (ctx: RumbleshipContext, response: IQueuedGqlResponse) => {
        await this.handler_updateServiceSchemaHandler(ctx, response);
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

  @AddToTrace()
  async initializeCacheRefreshRequest(ctx: RumbleshipContext): Promise<void> {
    this.queuedGqlRequestClient.onResponse({
      client_request_id: 'GetAllQueuedSubscriptionRequests',
      handler: async (ctx: RumbleshipContext, response: IQueuedGqlResponse): Promise<void> => {
        await this.handler_GetAllQueuedSubscriptionRequests(ctx, response);
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
      gql_query_string: buildPrimeQsrCacheListQuery({ first: 100 })
    });
  }

  @AddToTrace()
  async initializeCacheChangeObserver(ctx: RumbleshipContext): Promise<void> {
    // we listen directly to NODE_CHANGE_NOTIFICATIONS as the qsr_cache is not a full
    // Relay object
    // HOWEVER each service broadcasts on the channel so we filter out ones genrerated by this
    // service
    await this.qsrLocalCacheObserver.init();

    // kick off on its own promise chain
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.qsrLocalCacheObserver.start(
      async (ctx: RumbleshipContext, response: NodeChangePayload): Promise<void> => {
        await this.handler_localCacheChange(ctx, response);
      }
    );

    return;
  }
  /**
   * use instance methods for handlers as we want to take advantage of the automated tracing
   */
  @AddToTrace()
  async handler_localCacheChange(
    ctx: RumbleshipContext,
    response: NodeChangePayload
  ): Promise<void> {
    // we are very careful on messagees passed in as they may not be what we think they are
    if (response.publisher_service_name === this.config.serviceName) {
      // double check...as messages might not be what we think they should be
      if (response.oid) {
        const { scope } = new Oid(response.oid).unwrap();
        if (scope === QsrCacheOidScope) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.refreshSubscriptionsFromCache(ctx);
        }
      }
    }
  }

  @AddToTrace()
  async handler_updateServiceSchemaHandler(
    ctx: RumbleshipContext,
    response: IQueuedGqlResponse
  ): Promise<void> {
    ctx.logger.log(`received response to :${this.config.serviceName}_updateServiceSchema`);
  }

  @AddToTrace()
  async handler_GetAllQueuedSubscriptionRequests(
    ctx: RumbleshipContext,
    response: IQueuedGqlResponse
  ): Promise<void> {
    // We can get a response from multiple services, and google pub sub can
    // deliver it twice.
    ctx.beeline.addTraceContext({
      gql: {
        response: {
          client_request_id: response.client_request_id,
          serviced_by: response.service_name
        }
      }
    });
    if (response.response.data) {
      const { edges, pageInfo } = response.response.data['queuedSubscriptionRequests'];
      const qsrs: IQueuedSubscriptionRequest[] = (edges as Array<{
        node: IQueuedSubscriptionRequest;
      }>).map(entry => entry.node);
      if (qsrs.length) {
        await this.process_incoming_qsrs(ctx, qsrs);
        if (pageInfo && pageInfo.hasNextPage) {
          await this.queuedGqlRequestClient.makeRequest(ctx, {
            client_request_id: 'GetAllQueuedSubscriptionRequests',
            respond_on_error: true,
            gql_query_string: buildPrimeQsrCacheListQuery({ first: 100, after: pageInfo.endCursor })
          });
        }
      } else {
        // in development we might clear out the database and so we can get this situation where we have a cache but no
        // real qsrs. This is a special case and we deliberately clear the cache at this and active running queuedSubsctiptions
        // This may be better sorted through a flag in config, but fro now we do it this way
        await this.stopAndClearSubscriptions(ctx);
        await saveCache(new QueuedSubscriptionCache(this.config.Gcp.gaeVersion));
      }
    }
    if (response.response.errors) {
      for (const error of response.response.errors) {
        ctx.logger.error(`Error in response: ${printError(error)}`);
        ctx.beeline.finishSpan(
          ctx.beeline.startSpan({
            name: 'error',
            error: {
              ...error,
              plain: printError(error),
              stack: error.originalError?.stack,
              message: error.originalError?.message
            }
          })
        );
      }
    }
  }

  @AddToTrace()
  async handler_onQueuedSubscriptionRequestChange(
    ctx: RumbleshipContext,
    response: QueuedSubscriptionMessage
  ): Promise<void> {
    const changedQueuedRequest: IQueuedSubscriptionRequest =
      response.subscription_response.data?.[`onQueuedSubscriptionRequestChange`]?.node;
    if (changedQueuedRequest) {
      // All we do is add it to the cache... the cache will update, and the localCacheObserver will force the update to live subscriptions
      //
      await this.process_incoming_qsrs(ctx, [changedQueuedRequest]);
    }
  }

  // functions to add tracing
  loadCache = (
    ctx: RumbleshipContext,
    version: string,
    opts?:
      | {
          transaction?: Transaction | undefined;
        }
      | undefined
  ): Promise<QueuedSubscriptionCache> =>
    ctx.beeline.bindFunctionToTrace(() =>
      ctx.beeline.withAsyncSpan({ name: 'loadCache', 'meta.type': 'QsrCache' }, async _span => {
        return loadCache(version, opts);
      })
    )();
}
