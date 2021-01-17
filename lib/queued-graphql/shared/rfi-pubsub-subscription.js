"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSubSubscription = void 0;
const promiseRetry = require("promise-retry");
const spyglass_1 = require("@rumbleship/spyglass");
const events_1 = require("events");
const typedi_1 = require("typedi");
const helpers_1 = require("../helpers");
const o11y_1 = require("@rumbleship/o11y");
const uuid_1 = require("uuid");
class StopRetryingIteratorError extends Error {
}
class RfiPubSubSubscription {
    constructor(config, _pubSub, gcloud_topic_name, gcloud_subscription_name, delete_on_stop, subscriber_options) {
        this._pubSub = _pubSub;
        this.delete_on_stop = delete_on_stop;
        this.subscriber_options = subscriber_options;
        this._initiaized = false;
        this.logger = spyglass_1.logging.getLogger(config.Logging, { filename: __filename });
        this.gcloud_topic_name = gcloud_topic_name;
        this.gcloud_subscription_name = gcloud_subscription_name;
        this._subscription = this._pubSub.subscription(this.gcloud_subscription_name, subscriber_options);
        this.beeline = o11y_1.RumbleshipBeeline.make(uuid_1.v4());
    }
    async init() {
        if (!this._initiaized) {
            await this.initSubscription();
        }
    }
    async initSubscription() {
        // We dont care about ordering, as any client imposed orering should be defined in terms of
        // not firing another request until a response to a predecessor has been processsed
        // graphQl queries and mutations should not implicitly worry about order
        const [exists] = await this._subscription.exists();
        if (!exists) {
            const topic = await helpers_1.gcpGetTopic(this._pubSub, this.gcloud_topic_name, true);
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
    start(handler, source_name = this.constructor.name) {
        const trace = this.beeline.startTrace({ name: 'RfiPubSubSubscription.start' });
        this.beeline.addTraceContext({
            gcloud_topic_name: this.gcloud_topic_name,
            gcloud_subscription_name: this.gcloud_subscription_name,
            projectId: this._pubSub.projectId
        });
        const initAndIterate = async () => {
            await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.init' }, async () => await this.init());
            await promiseRetry(async (retry, number) => {
                await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.listen' }, async () => {
                    this.beeline.addTraceContext({ 'RfiPubSubSubscription.retry.number': number });
                    return await this.listen(handler, source_name, trace).catch(error => {
                        console.log(error);
                        retry(error);
                    });
                });
            }, {
                minTimeout: 2000,
                // Better to keep retrying until infinity, or set an arbitrary high number, at which point
                // we just kill the process?
                // If former, do we mask a problem?
                // If the latter, then GCP will restart process with low backoff, maybe thrashing?
                retries: 100
            });
        };
        const wrapped = this.beeline.bindFunctionToTrace(async () => {
            await initAndIterate();
        });
        return wrapped();
    }
    dispatch(ctx, message, handler, source_name = this.constructor.name) {
        const message_data = message.data.toString();
        const payload = this.parseMessage(message_data);
        if (payload) {
            const { marshalled_trace, ...rest_of_payload } = payload;
            ctx.beeline.addTraceContext({
                gcloud_topic_name: this.gcloud_topic_name,
                gcloud_subscription_name: this.gcloud_subscription_name,
                projectId: this._pubSub.projectId,
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
                .withAsyncSpan({ name: 'RfiPubSubSubscription.dispatch' }, () => handler(ctx, rest_of_payload))
                .catch(error => {
                ctx.logger.error(error.message);
                ctx.logger.error(error.stack);
                ctx.beeline.addTraceContext({
                    'error.message': error.message,
                    'error.stack': error.stack
                });
                throw error;
            })
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
    async listen(handler, source_name = this.constructor.name, trace) {
        let start_success = false;
        let pending_message;
        this.logger.info(`RfiPubSubSubscription: Starting message loop for ${this.constructor.name} : ${this.gcloud_topic_name}, subscription: ${this.gcloud_subscription_name}, pubsubProjectId: ${this._pubSub.projectId}`);
        try {
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
                    const ctx = typedi_1.Container.get('RumbleshipContext').make(__filename, {
                        marshalled_trace: payload.marshalled_trace,
                        linked_span: this.beeline.getTraceContext()
                    });
                    await this.beeline.runWithoutTrace(() => this.dispatch(ctx, pending_message, handler, source_name));
                    if (!start_success) {
                        start_success = true;
                        this.beeline.finishTrace(trace);
                    }
                }
                pending_message.ack();
            }
        }
        catch (error) {
            // if there are any pending messages, they will time out and be sent else where
            // but more responsive to nack it
            if (pending_message) {
                pending_message.nack();
                pending_message = undefined;
            }
            this.beeline.addTraceContext({ error });
            this.logger.error(error.stack, { error });
            // in case we get into a nasty failure loop
            // await sleep(500);
            throw error;
        }
        this.beeline.addTraceContext({ 'RfiPubSubSubscription.iterate.stopped': true });
        this.beeline.finishSpan(this.beeline.startSpan({ name: 'RfiPubSubSubscription.iterate.stop' }));
        this.logger.info(`Stopped message loop for ${source_name} : ${this.gcloud_topic_name} ${this.gcloud_topic_name}, subscription: ${this.gcloud_subscription_name}`);
    }
    parseMessage(message_data) {
        try {
            const payload = JSON.parse(message_data);
            return payload;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                this.logger.error(error.stack, { message_data });
                return undefined;
            }
            throw error;
        }
    }
    async stop() {
        var _a;
        await ((_a = this._subscription) === null || _a === void 0 ? void 0 : _a.close());
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
    get messages() {
        if (this._subscription) {
            return merge([events_1.on(this._subscription, 'message'), events_1.on(this._subscription, 'close')]);
        }
        throw new Error('this._subscriptions must be initialized');
    }
}
exports.RfiPubSubSubscription = RfiPubSubSubscription;
// see https://stackoverflow.com/questions/50585456/how-can-i-interleave-merge-async-iterables
async function* merge(iterable) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results = [];
    let count = asyncIterators.length;
    const never = new Promise(() => {
        return;
    });
    async function getNext(asyncIterator, index) {
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
                nextPromises[index] = never;
                results[index] = result.value;
                count--;
            }
            else {
                nextPromises[index] = getNext(asyncIterators[index], index);
                yield result.value;
            }
        }
    }
    finally {
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
//# sourceMappingURL=rfi-pubsub-subscription.js.map