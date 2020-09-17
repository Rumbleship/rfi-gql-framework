import { PubSub as GooglePubSub, Topic, Subscription } from '@google-cloud/pubsub';
export declare function gcpGetTopic(pubsub: GooglePubSub, topic_name: string): Promise<Topic>;
export declare function gcpCreatePushSubscription(topic: Topic, subscription_name: string, subscription_url: string): Promise<Subscription>;
