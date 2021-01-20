import { PubSub as GooglePubSub, Topic, Subscription } from '@google-cloud/pubsub';
export declare function gcpGetTopic(pubsub: GooglePubSub, topic_name: string, messageOrdering: boolean): Promise<Topic>;
/**
 *
 * @param topic
 * @param subscription_name
 * @param subscription_url
 * @param service_account_email
 * @returns
 *
 * @note This is used by Orders/QSRService to create the subscription topics that power webhook delivery
 */
export declare function gcpCreatePushSubscription(topic: Topic, subscription_name: string, subscription_url: string, service_account_email: string): Promise<Subscription>;
