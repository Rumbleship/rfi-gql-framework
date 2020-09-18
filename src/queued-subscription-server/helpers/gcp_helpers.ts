import { PubSub as GooglePubSub, Topic, Subscription } from '@google-cloud/pubsub';
export async function gcpGetTopic(pubsub: GooglePubSub, topic_name: string): Promise<Topic> {
  let topic = pubsub.topic(topic_name);
  const [exists] = await topic.exists();
  if (!exists) {
    try {
      [topic] = await pubsub.createTopic(topic_name);
    } catch (e) {
      const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
      if (e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
        // It can be created during a race condition,
        // so try again
        topic = pubsub.topic(topic_name);
      } else {
        throw e;
      }
    }
  }
  return topic;
}

export async function gcpCreatePushSubscription(
  topic: Topic,
  subscription_name: string,
  subscription_url: string
): Promise<Subscription> {
  const options = {
    pushConfig: {
      // Set to an HTTPS endpoint of your choice. If necessary, register
      // (authorize) the domain on which the server is hosted.
      pushEndpoint: subscription_url
    }
  };

  const [subscription] = await topic.createSubscription(subscription_name, options);
  return subscription;
}
