import {
  CreateSubscriptionOptions,
  Message,
  PubSub as GooglePubSub,
  Subscription,
  Topic
} from '@google-cloud/pubsub';
import { MessageOptions } from '@google-cloud/pubsub/build/src/topic';
import { on } from 'events';
import { gcpGetTopic } from '../queued-graphql';

/**
 * Utility for proving and testing that google pubsub ordering works
 * as expected, because their docs are not clear.
 *
 * Tested through @google-cloud/pubsub#2.8.0
 */
class Publisher {
  public pubsub: GooglePubSub;
  public message_one_received = false;
  public message_two_received = false;
  public count = 0;
  constructor() {
    this.pubsub = new GooglePubSub();
  }

  orderedTopic() {
    return gcpGetTopic(this.pubsub, 'test-ordered', true);
  }
  unorderedTopic() {
    return gcpGetTopic(this.pubsub, 'test-unordered', false);
  }
  async publishUnordered(message: Record<string, any>) {
    const topic = await this.unorderedTopic();
    await topic.publish(Buffer.from(JSON.stringify(message)));
  }
  async publishOrdered(message_data: Record<string, any>) {
    const topic = await this.orderedTopic();
    const message: MessageOptions = {
      data: Buffer.from(JSON.stringify(message_data)),
      orderingKey: 'orderme'
    };
    await topic.publishMessage(message);
  }

  protected async initSubscription(
    topic: Topic,
    subscription_name: string,
    opts: CreateSubscriptionOptions = {}
  ): Promise<Subscription> {
    const subscription = topic.subscription(subscription_name);
    // We dont care about ordering, as any client imposed orering should be defined in terms of
    // not firing another request until a response to a predecessor has been processsed
    // graphQl queries and mutations should not implicitly worry about order
    try {
      const [exists] = await subscription.exists();
      if (!exists) {
        // NOTE we dont need to create an ordered subscription
        // as a graphql query or mnutation should be fairly standalone
        // if a client requires that, then as with a http graphql request, it would be expected
        // to wait for the response of the predecessor before sending the next request.
        // the client maps its requests, if needed via clientRequestId's
        const [newSub] = await topic.createSubscription(subscription.name, {
          enableMessageOrdering: true
        });
        return newSub;
      }
    } catch (error) {
      if (error.code === 6) {
        return subscription;
      }
      throw error;
    }

    return subscription;
  }

  async listenUnordered(instance_id = 1) {
    const topic = await this.unorderedTopic();
    const subscription = await this.initSubscription(topic, 'unordered-sub');
    for await (const [message] of this.messages(subscription)) {
      this.count++;
      const message_data = message.data.toString();
      const payload = this.parseMessage(message_data);
      this.handler(message_data, message, payload, instance_id);
      if (this.message_one_received && this.message_two_received) {
        break;
      }
    }
  }

  async listenOrdered(instance_id: number) {
    const topic = await this.orderedTopic();
    const subscription = await this.initSubscription(topic, 'ordered-sub', {
      enableMessageOrdering: true
    });
    for await (const [message] of on(subscription, 'message')) {
      this.count++;
      const message_data = message.data.toString();
      const payload = this.parseMessage(message_data);
      this.handler(message_data, message, payload, instance_id);
      if (this.message_one_received && this.message_two_received) {
        break;
      }
    }
  }

  handler(message_data: any, message: any, payload: any, instance_id: number) {
    if (payload.order_number === 1) {
      if (!this.message_two_received) {
        message.nack();
        console.log('nack');
      } else {
        message.ack();
        console.log('ack');
        this.message_one_received = true;
      }
    }

    if (payload.order_number === 2) {
      if (this.message_one_received) {
        message.ack();
        console.log('ack');
        this.message_two_received = true;
      } else {
        message.nack();
        console.log('nack');
      }
    }
    console.log(message_data, payload, this.count, message.id);
  }

  messages(subscription: Subscription): AsyncIterableIterator<Message[]> {
    return on(subscription, 'message');
  }

  parseMessage(message_data: string): any | undefined {
    try {
      const payload: any = JSON.parse(message_data);
      return payload;
    } catch (error) {
      if (error instanceof SyntaxError) {
        return undefined;
      }
      throw error;
    }
  }
}

async function main() {
  const ordered = process.argv[2] === 'ordered';
  const publish = process.argv[3] === 'publish';
  if (ordered) {
    if (publish) {
      await runOrderedPublisher();
    } else {
      await runOrderedListener();
    }
  } else {
    if (publish) {
      await runUnorderedPublisher();
    } else {
      await runUnorderedListener();
    }
  }
}

async function runOrderedListener() {
  const publisher = new Publisher();
  await Promise.all([publisher.listenOrdered(1), publisher.listenOrdered(2)]);
}
async function runUnorderedListener() {
  const publisher = new Publisher();
  await Promise.all([publisher.listenUnordered(), publisher.listenUnordered()]);
  console.log('hi');
}

async function runUnorderedPublisher() {
  const publisher = new Publisher();
  await publisher.publishUnordered({ order_number: 1 });
  await publisher.publishUnordered({ order_number: 2 });
}

async function runOrderedPublisher() {
  const publisher = new Publisher();
  await publisher.publishOrdered({ order_number: 1 });
  await publisher.publishOrdered({ order_number: 2 });
}

main()
  .then(() => process.exit(0))
  .catch(async error => {
    console.error(error);
    return setTimeout(() => process.exit(1), 500);
  });
