import promiseRetry = require('promise-retry');
import { Subscription, PubSub as GooglePubSub, Message } from '@google-cloud/pubsub';
import { logging, SpyglassLogger } from '@rumbleship/spyglass';
import { on } from 'events';
// tslint:disable-next-line: no-submodule-imports
import { SubscriberOptions } from '@google-cloud/pubsub/build/src/subscriber';

import { Container } from 'typedi';
import { gcpGetTopic } from '../helpers';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { HoneycombSpan, RumbleshipBeeline } from '@rumbleship/o11y';
import { v4 } from 'uuid';

class StopRetryingIteratorError extends Error {}
export class RfiPubSubSubscription<T> {
  protected _initiaized = false;
  private _subscription: Subscription;
  protected gcloud_topic_name: string;
  protected gcloud_subscription_name: string;
  protected logger: SpyglassLogger;
  protected beeline: RumbleshipBeeline;
  constructor(
    config: ISharedSchema,
    protected _pubSub: GooglePubSub,
    gcloud_topic_name: string,
    gcloud_subscription_name: string,
    protected delete_on_stop: boolean,
    protected subscriber_options?: SubscriberOptions
  ) {
    this.logger = logging.getLogger(config.Logging, { filename: __filename });
    this.gcloud_topic_name = gcloud_topic_name;
    this.gcloud_subscription_name = gcloud_subscription_name;
    this._subscription = this._pubSub.subscription(
      this.gcloud_subscription_name,
      subscriber_options
    );
    this.beeline = RumbleshipBeeline.make(v4());
  }

  async init(): Promise<void> {
    if (!this._initiaized) {
      await this.initSubscription();
    }
  }
  protected async initSubscription(): Promise<Subscription> {
    // We dont care about ordering, as any client imposed orering should be defined in terms of
    // not firing another request until a response to a predecessor has been processsed
    // graphQl queries and mutations should not implicitly worry about order
    const [exists] = await this._subscription.exists();
    if (!exists) {
      const topic = await gcpGetTopic(this._pubSub, this.gcloud_topic_name, true);
      // NOTE we dont need to create an ordered subscription
      // as a graphql query or mnutation should be fairly standalone
      // if a client requires that, then as with a http graphql request, it would be expected
      // to wait for the response of the predecessor before sending the next request.
      // the client maps its requests, if needed via clientRequestId's
      const [newSub] = await topic.createSubscription(this.gcloud_subscription_name, {
        enableMessageOrdering: true
      });
      this._subscription = newSub;
    }

    return this._subscription;
  }

  public start(
    handler: (ctx: RumbleshipContext, payload: T) => Promise<void>,
    source_name: string = this.constructor.name
  ): Promise<void> {
    const trace = this.beeline.startTrace({ name: 'RfiPubSubSubscription.start' });
    this.beeline.addTraceContext({
      gcloud_topic_name: this.gcloud_topic_name,
      gcloud_subscription_name: this.gcloud_subscription_name,
      projectId: this._pubSub.projectId
    });
    const initAndListen = async () => {
      await this.beeline.withAsyncSpan(
        { name: 'RfiPubSubSubscription.init' },
        async () => await this.init()
      );
      await promiseRetry(
        async (retry, number) => {
          await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.listen' }, async () => {
            this.beeline.addTraceContext({ 'RfiPubSubSubscription.retry.number': number });
            return await this.listen(handler, source_name, trace).catch(error => {
              this.beeline.addTraceContext({ error });
              if (error instanceof StopRetryingIteratorError) {
                return;
              }
              return retry(error);
            });
          });
        },
        {
          minTimeout: 2000,
          // Better to keep retrying until infinity, or set an arbitrary high number, at which point
          // we just kill the process?
          // If former, do we mask a problem?
          // If the latter, then GCP will restart process with low backoff, maybe thrashing?
          retries: 20
        }
      ).catch(error => {
        // Promise Retry has failed to bring the subscription up. Note the failure, and sigterm the whole process.
        // GAE will take care of bringing it back up.
        this.beeline.addTraceContext({ RfiPubSubSubscription: { start: false } });
        this.beeline.addTraceContext({ error });
        this.logger.error(error);
        this.beeline.finishSpan(this.beeline.startTrace({ name: 'error' }));
        process.kill(process.pid, 'SIGTERM');
      });
    };

    const wrapped = this.beeline.bindFunctionToTrace(async () => {
      await initAndListen();
    });
    return wrapped();
  }

  private dispatch(
    ctx: RumbleshipContext,
    message: Message,
    handler: (ctx: RumbleshipContext, payload: T) => Promise<void>,
    source_name: string = this.constructor.name
  ): Promise<void> {
    const message_data = message.data.toString();
    const payload = this.parseMessage(message_data);
    if (payload) {
      const { marshalled_trace, ...rest_of_payload } = (payload as unknown) as {
        marshalled_trace?: string;
      } & Record<string, unknown>;
      ctx.beeline.addTraceContext({
        topic: { name: this.gcloud_topic_name, orderingKey: message.orderingKey },
        subscription: {
          name: this.gcloud_subscription_name,
          orderingKey: message.orderingKey
        },
        pubsub: { projectId: this._pubSub.projectId },
        message: {
          id: message.id,
          deliveryAttempt: message.deliveryAttempt,
          attributes: message.attributes,
          orderingKey: message.orderingKey,
          publishTime: message.publishTime,
          received: message.received
        }
      });
      return ctx.beeline
        .bindFunctionToTrace(() =>
          ctx.beeline
            .withAsyncSpan({ name: 'RfiPubSubSubscription.dispatch' }, () =>
              handler(ctx, (rest_of_payload as unknown) as T)
            )
            .then(() => message.ack())
            .catch(error => {
              ctx.logger.error(error.message);
              ctx.logger.error(error.stack);
              ctx.beeline.addTraceContext({
                'error.message': error.message,
                'error.stack': error.stack
              });
              message.nack();
            })
        )()
        .finally(() => ctx.release());
    }
    // This is maybe wrong
    throw new Error('missing payload');
  }

  /**
   *
   * @param handler
   * @param source_name
   * @returns {Promise<boolean>} whether or not the process should be restarted
   *
   * @note this function swallows errors and manages reporting them itself
   */
  private async listen(
    handler: (ctx: RumbleshipContext, payload: T) => Promise<void>,
    source_name: string = this.constructor.name,
    trace: HoneycombSpan
  ): Promise<void> {
    let start_success = false;
    let pending_message: Message | undefined;
    this.logger.info(
      `RfiPubSubSubscription: Starting message loop for ${this.constructor.name} : ${this.gcloud_topic_name}, subscription: ${this.gcloud_subscription_name}, pubsubProjectId: ${this._pubSub.projectId}`
    );

    /**
     * @note google api docs say we always receive one message at a time, even though it is
     * an array type.
     *
     * We explicitly add in a listerner for 'close' to the iterator - see ServiceSubscription
     *
     * @see {messages()} getter that merges both `close` and `message` events into a single iterable
     * which allows us to stop the loop on `close`. Errors are throw by the `on` method.
     */
    for await (const [message] of this.messages) {
      pending_message = message;
      if (!message) {
        throw new StopRetryingIteratorError();
      }
      const message_data = message.data.toString();
      const payload = this.parseMessage(message_data);
      if (payload) {
        await this.beeline.runWithoutTrace(async () => {
          const ctx = Container.get<typeof RumbleshipContext>('RumbleshipContext').make(
            __filename,
            {
              marshalled_trace: (payload as any).marshalled_trace,
              linked_span: this.beeline.getTraceContext(),
              initial_trace_metadata: { meta: { source: 'RfiPubSubSubscription.listen' } }
            }
          );

          await this.dispatch(ctx, pending_message as Message, handler, source_name);
        });
        if (!start_success) {
          start_success = true;
          this.beeline.finishTrace(trace);
        }
      }
    }

    this.beeline.addTraceContext({ 'RfiPubSubSubscription.iterate.stopped': true });
    this.beeline.finishSpan(this.beeline.startSpan({ name: 'RfiPubSubSubscription.iterate.stop' }));
    this.logger.info(
      `Stopped message loop for ${source_name} : ${this.gcloud_topic_name} ${this.gcloud_topic_name}, subscription: ${this.gcloud_subscription_name}`
    );
  }
  parseMessage(message_data: string): T | undefined {
    try {
      const payload: T = JSON.parse(message_data);
      return payload;
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(error.stack, { message_data });
        return undefined;
      }
      throw error;
    }
  }
  public async stop(): Promise<void> {
    await this._subscription?.close();
    if (this.delete_on_stop) {
      await this._subscription.delete();
    }
  }
  /**
   * sets up listener and turns it into an AsyncIterableIterator
   * for use in for await ( const message of this.messages ) {}
   *
   * Clean event queue, but make sure that message.ack() is called
   * and if the message processing may take some time, may need to adjust the google
   * pubsub
   *
   */
  get messages(): AsyncIterableIterator<Message[]> {
    if (this._subscription) {
      return merge([on(this._subscription, 'message'), on(this._subscription, 'close')]);
    }
    throw new Error('this._subscriptions must be initialized');
  }
}

// see https://stackoverflow.com/questions/50585456/how-can-i-interleave-merge-async-iterables
async function* merge<T>(iterable: Array<AsyncIterable<T>>) {
  const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
  const results = [];
  let count = asyncIterators.length;
  const never = new Promise(() => {
    return;
  });
  async function getNext<V>(asyncIterator: AsyncIterator<V>, index: number) {
    const result = await asyncIterator.next();
    return {
      index,
      result
    };
  }
  const nextPromises = asyncIterators.map(getNext);
  try {
    while (count) {
      const { index, result } = await Promise.race(nextPromises);
      if (result.done) {
        (nextPromises[index] as any) = never;
        results[index] = result.value;
        count--;
      } else {
        nextPromises[index] = getNext(asyncIterators[index], index);
        yield result.value;
      }
    }
  } finally {
    for (const [index, iterator] of asyncIterators.entries()) {
      if (nextPromises[index] !== never && iterator.return != null) {
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        iterator.return();
      }
    }
  }
  return results;
}
