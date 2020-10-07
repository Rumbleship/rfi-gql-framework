import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { IQueuedSubscriptionRequest, SubscriptionResponse } from './queued-subscription-request.interface';
import { QueuedSubscription } from './queued-subscription';
import { QueuedGqlRequestClientOneInstanceResponder } from '../../clients/queued-gql-request-client';
import { RfiPubSubSubscription } from '../../shared';
import { QueuedSubscriptionCache } from '../../queued-subscription-cache';
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
    qsrChangeObserver: RfiPubSubSubscription<SubscriptionResponse>;
    queuedGqlRequestClient: QueuedGqlRequestClientOneInstanceResponder;
    constructor(config: ISharedSchema, schema: GraphQLSchema);
    /**
     * Setup a subscription to the QueuedSubscriptionRequest model to
     * look for changes to active flag.
     * @param schema
     */
    initializeQsrChangeObserver(): Promise<void>;
    refreshSubscriptionsFromCache(qsrCache: QueuedSubscriptionCache): Promise<void>;
    start(ctx: RumbleshipContext): Promise<void>;
    stop(): Promise<void>;
    /**
     * Adds and starts the subscription
     * @param request
     */
    addSubscriptionAndStart(key: string, request: IQueuedSubscriptionRequest): QueuedSubscription;
    removeSubscription(key: string): Promise<void>;
}
