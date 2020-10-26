import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientSingleInstanceResponder } from '../../clients/gql-request/queued-gql-request-client';
import { IQueuedGqlResponse } from '../../interfaces';
import { RfiPubSubSubscription } from '../../shared';
import { QueuedSubscriptionCache } from '../../queued-subscription-cache';
import { QueuedSubscriptionMessage } from './queued-subscription-message';
import { NodeChangePayload } from '../../../app/server/rfi-pub-sub-engine.interface';
import { Transaction } from 'sequelize/types';
export declare const QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = "QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC";
export declare const QSR_GQL_FRAGMENT = "\n  fragment qsr on QueuedSubscriptionRequest {\n    id\n    subscription_name\n    cache_consistency_id\n    marshalled_acl\n    gql_query_string\n    active\n    owner_id\n    operation_name\n    query_attributes\n    publish_to_topic_name\n    serviced_by\n    deleted_at\n  }\n";
/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 * TODO: Should we also watch for deleted_at changes and turn paranoid on in the repository?
 *
 *
 */
export declare const QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL: string;
export declare const QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL: string;
export declare class QueuedSubscriptionServer {
    protected config: ISharedSchema;
    schema: GraphQLSchema;
    queuedSubscriptions: Map<string, QueuedSubscription>;
    qsrChangeObserver: RfiPubSubSubscription<QueuedSubscriptionMessage>;
    qsrLocalCacheObserver: RfiPubSubSubscription<NodeChangePayload>;
    queuedGqlRequestClient: QueuedGqlRequestClientSingleInstanceResponder;
    constructor(config: ISharedSchema, schema: GraphQLSchema);
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    initializeQsrChangeObserver(): Promise<void>;
    process_incoming_qsrs(ctx: RumbleshipContext, incomingQsrs: IQueuedSubscriptionRequest[]): Promise<void>;
    /**
     * Utility to dump out current qsrs... usefull debug tool
     */
    logActiveQsrs(ctx: RumbleshipContext): void;
    refreshSubscriptionsFromCache(ctx: RumbleshipContext, qsrCache?: QueuedSubscriptionCache): Promise<number>;
    start(ctx: RumbleshipContext): Promise<void>;
    stop(ctx: RumbleshipContext): Promise<void>;
    stopAndClearSubscriptions(ctx: RumbleshipContext): Promise<void>;
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscriptionAndStart(ctx: RumbleshipContext, key: string, request: IQueuedSubscriptionRequest): QueuedSubscription;
    removeSubscription(ctx: RumbleshipContext, key: string): Promise<void>;
    hasSubscription(key: string): boolean;
    getSubscription(key: string): QueuedSubscription | undefined;
    /**
     * Sends the schema and its hash to the QueuedSubscriptionManagement service so that QSR's
     * can be validated before being accepted.
     *
     * When a schema
     */
    publishSchema(ctx: RumbleshipContext): Promise<void>;
    initializeCacheRefreshRequest(ctx: RumbleshipContext): Promise<void>;
    initializeCacheChangeObserver(ctx: RumbleshipContext): Promise<void>;
    /**
     * use instance methods for handlers as we want to take advantage of the automated tracing
     */
    handler_localCacheChange(ctx: RumbleshipContext, response: NodeChangePayload): Promise<void>;
    handler_updateServiceSchemaHandler(ctx: RumbleshipContext, response: IQueuedGqlResponse): Promise<void>;
    handler_GetAllQueuedSubscriptionRequests(ctx: RumbleshipContext, response: IQueuedGqlResponse): Promise<void>;
    handler_onQueuedSubscriptionRequestChange(ctx: RumbleshipContext, response: QueuedSubscriptionMessage): Promise<void>;
    loadCache: (ctx: RumbleshipContext, version: string, opts?: {
        transaction?: Transaction | undefined;
    } | undefined) => Promise<QueuedSubscriptionCache>;
}
