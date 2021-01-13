import { PubSub as GooglePubSub, Topic, Subscription } from '@google-cloud/pubsub';
export declare function gcpGetTopic(pubsub: GooglePubSub, topic_name: string, messageOrdering: boolean): Promise<Topic>;
export declare function gcpCreatePushSubscription(topic: Topic, subscription_name: string, subscription_url: string, service_account_email: string): Promise<Subscription>;
