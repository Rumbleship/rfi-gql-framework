import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { RfiPubSubSubscription } from '../../shared';
import { QueuedSubscriptionCache } from '../../queued-subscription-cache';
import { QueuedSubscriptionMessage } from './queued-subscription-message';
import { NodeChangePayload } from '../../../app/server/rfi-pub-sub-engine.interface';
export declare const QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC = "QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC";
export declare const QSR_GQL_FRAGMENT = "\n  fragment qsr on QueuedSubscriptionRequest {\n    id\n    cache_consistency_id\n    marshalled_acl\n    gql_query_string\n    active\n    owner_id\n    operation_name\n    query_attributes\n    publish_to_topic_name\n\n  }\n";
/**
 * This is exported to be used by the QueuedSubscription Repository Service to
 * run while it is working. All instances of the QUEUED_SUBSCRIPTION_REPO_CHANGE_TOPIC
 * subscribe to the responses, and so everyone can update thier cache
 */
export declare const QUEUED_SUBSCRIPTION_REPO_CHANGE_GQL: string;
export declare const QUEUED_SUBSCRIPTION_REQUEST_LIST_GQL: string;
export declare class QueuedSubscriptionServer {
    protected config: ISharedSchema;
    schema: GraphQLSchema;
    queuedSubscriptions: Map<string, QueuedSubscription>;
    in_memory_cache_consistency_id: number;
    qsrChangeObserver: RfiPubSubSubscription<QueuedSubscriptionMessage>;
    qsrLocalCacheObserver: RfiPubSubSubscription<NodeChangePayload>;
    queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;
    constructor(config: ISharedSchema, schema: GraphQLSchema);
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    initializeQsrChangeObserver(): Promise<void>;
    process_incoming_qsr(ctx: RumbleshipContext, incomingQsrs: IQueuedSubscriptionRequest[]): Promise<void>;
    refreshSubscriptionsFromCache(qsrCache?: QueuedSubscriptionCache): Promise<number>;
    start(ctx: RumbleshipContext): Promise<void>;
    stop(): Promise<void>;
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscriptionAndStart(key: string, request: IQueuedSubscriptionRequest): QueuedSubscription;
    removeSubscription(key: string): Promise<void>;
    hasSubscription(key: string): boolean;
    getSubscription(key: string): QueuedSubscription | undefined;
    /**
     * Sends the schema and its hash to the QueuedSubscriptionManagement service so that QSR's
     * can be validated before being accepted.
     *
     * When a schema
     */
    publishSchema(ctx: RumbleshipContext): Promise<void>;
    initializeCacheChangeObserver(): Promise<void>;
}
