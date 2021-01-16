"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSubSubscription = void 0;
const spyglass_1 = require("@rumbleship/spyglass");
const events_1 = require("events");
const typedi_1 = require("typedi");
const helpers_1 = require("../helpers");
const sleep_1 = require("../../helpers/sleep");
const o11y_1 = require("@rumbleship/o11y");
const uuid_1 = require("uuid");
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
        const initStartAndIterate = async () => {
            await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.init' }, async () => await this.init());
            const should_restart = await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.iterate' }, async () => {
                return await this.iterate(handler, source_name);
            });
            return should_restart;
        };
        const wrapped = this.beeline.bindFunctionToTrace(async () => {
            const should_restart = await initStartAndIterate().finally(() => {
                // Force the finishing of the trace before recursing and restarting
                this.beeline.finishTrace(trace);
            });
            return should_restart;
        });
        return wrapped().then(should_restart => {
            if (should_restart) {
                return this.start(handler, source_name);
            }
            return undefined;
        });
    }
    /**
     *
     * @param handler
     * @param source_name
     * @returns {Promise<boolean>} whether or not the process should be restarted
     *
     * @note this function swallows errors and manages reporting them itself
     */
    async iterate(handler, source_name = this.constructor.name) {
        let pending_message;
        let restart_on_iterable_error = true;
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
                    restart_on_iterable_error = false;
                    break;
                }
                await this.beeline.withAsyncSpan({ name: 'RfiPubSubSubscription.dispatchToHandler' }, async () => {
                    // add message to trace context of dispatcher
                    this.beeline.addTraceContext({
                        message: {
                            id: message.id,
                            deliveryAttempt: message.deliveryAttempt,
                            attributes: message.attributes,
                            orderingKey: message.orderingKey,
                            publishTime: message.publishTime,
                            received: message.received
                        }
                    });
                    const message_data = message.data.toString();
                    const payload = this.parseMessage(message_data);
                    if (payload) {
                        const { marshalled_trace, ...rest_of_payload } = payload;
                        this.beeline.addTraceContext({ message: { payload: rest_of_payload } });
                        // Set up an entirely new ctx (and trace) to execute the handler -- and feed it whatever
                        // trace data has come in on message
                        await this.beeline.runWithoutTrace(() => {
                            const ctx = typedi_1.Container.get('RumbleshipContext').make(__filename, {
                                marshalled_trace,
                                linked_span: this.beeline.getTraceContext()
                            });
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
                            return handler(ctx, payload)
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
                        });
                    }
                    message.ack();
                });
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
            await sleep_1.sleep(500);
        }
        this.logger.info(`Stopped message loop for ${source_name} : ${this.gcloud_topic_name} ${this.gcloud_topic_name}, subscription: ${this.gcloud_subscription_name}`);
        return restart_on_iterable_error;
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