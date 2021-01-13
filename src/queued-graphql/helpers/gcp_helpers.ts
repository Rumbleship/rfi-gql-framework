import {
  PubSub as GooglePubSub,
  Topic,
  Subscription,
  CreateSubscriptionOptions
} from '@google-cloud/pubsub';
export async function gcpGetTopic(
  pubsub: GooglePubSub,
  topic_name: string,
  messageOrdering: boolean
): Promise<Topic> {
  let topic = pubsub.topic(topic_name, { messageOrdering });
  const [exists] = await topic.exists();
  if (!exists) {
    try {
      await pubsub.createTopic(topic_name);
      topic = pubsub.topic(topic_name, { messageOrdering });
    } catch (e) {
      const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
      if (e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
        // It can be created during a race condition,
        // so try again
        topic = pubsub.topic(topic_name, { messageOrdering });
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
  subscription_url: string,
  service_account_email: string
): Promise<Subscription> {
  const options: CreateSubscriptionOptions = {
    pushConfig: {
      // Set to an HTTPS endpoint of your choice. If necessary, register
      // (authorize) the domain on which the server is hosted.
      pushEndpoint: subscription_url,
      oidcToken: { serviceAccountEmail: service_account_email }
    },
    enableMessageOrdering: true
  };
  let subscription = topic.subscription(subscription_name);
  const [exists] = await subscription.exists();
  try {
    if (!exists) {
      [subscription] = await topic.createSubscription(subscription_name, options);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await subscription.modifyPushConfig(options.pushConfig!);
    }
  } catch (e) {
    const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
    if (e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
      // It can be created during a race condition,
      // so try again
      subscription = topic.subscription(subscription_name);
    } else {
      throw e;
    }
  }
  return subscription;
}
