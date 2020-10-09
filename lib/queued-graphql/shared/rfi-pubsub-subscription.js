"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSubSubscription = void 0;
const spyglass_1 = require("@rumbleship/spyglass");
const events_1 = require("events");
const typedi_1 = require("typedi");
const helpers_1 = require("../helpers");
const sleep_1 = require("../../helpers/sleep");
class RfiPubSubSubscription {
    constructor(config, _pubSub, topic_name, subscription_name, subscriber_options) {
        this._pubSub = _pubSub;
        this.subscriber_options = subscriber_options;
        this._initiaized = false;
        this.logger = spyglass_1.logging.getLogger(config.Logging, { filename: __filename });
        this.topic_name = topic_name;
        this.subscription_name = subscription_name;
        this._subscription = this._pubSub.subscription(this.subscription_name, subscriber_options);
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
            const topic = await helpers_1.gcpGetTopic(this._pubSub, this.topic_name);
            // NOTE we dont need to create an ordered subscription
            // as a graphql query or mnutation should be fairly standalone
            // if a client requires that, then as with a http graphql request, it would be expected
            // to wait for the response of the predecessor before sending the next request.
            // the client maps its requests, if needed via clientRequestId's
            const [newSub] = await topic.createSubscription(this.subscription_name, {
                enableMessageOrdering: false
            });
            this._subscription = newSub;
        }
        return this._subscription;
    }
    async start(handler, source_name = this.constructor.name) {
        let pending_message;
        let message_data;
        await this.init();
        let retry = true;
        while (retry) {
            this.logger.info(`RfiPubSubSubscription: Starting message loop for ${this.constructor.name} : ${this.topic_name}, subscription: ${this.subscription_name}`);
            try {
                // the API reference says that we ALWAYS provess one message at a time,
                // even though we receive an array. We add in a listerner for 'close' to the iterator - see ServiceSubscription
                for await (const [message] of this.messages) {
                    // for instrumentation discussion....start context
                    // emit contextHookEvent with context + contextHandler (distinct from handler, which user has defined )
                    pending_message = message;
                    if (!message) {
                        // emit contextHookEvent, this handler
                        // see 'get messages()': both close and message events are merged into one iterable
                        // so we can stop the loop on a 'close'. 'error's get thrown by the 'on' methods
                        retry = false;
                        break;
                    }
                    message_data = message.data.toString();
                    const payload = this.parseMessage(message_data);
                    if (payload) {
                        const marshalled_trace = Reflect.get(payload, 'marshalled_trace');
                        const ctx = typedi_1.Container.get('RumbleshipContext').make(__filename, {
                            marshalled_trace
                        });
                        await handler(payload, ctx)
                            .catch(error => {
                            // Explicitly do not rethrow error; doing so will kill the dispatch manager.
                            ctx.logger.error(error.message);
                            ctx.logger.error(error.stack);
                            ctx.beeline.addTraceContext({
                                'error.message': error.message,
                                'error.stack': error.stack
                            });
                        })
                            .finally(() => ctx.release());
                    }
                    message.ack();
                    pending_message = undefined;
                }
                this.logger.info(`Stopped message loop for ${source_name} : ${this.topic_name} ${this.topic_name}, subscription: ${this.subscription_name}`);
            }
            catch (error) {
                // if there are any pending messages, they will time out and be sent else where
                // but more responsive to nack it
                if (pending_message) {
                    pending_message.nack();
                    pending_message = undefined;
                }
                this.logger.error(`Exception in message loop for ${source_name} : ${this.topic_name}, subscription: ${this.subscription_name}`, {
                    subscriptionServiceClass: source_name,
                    topic: this.topic_name,
                    subscription: this.subscription_name,
                    message_data: message_data !== null && message_data !== void 0 ? message_data : ''
                });
                this.logger.error(error.stack, { error });
            }
            // in case we get into a nasty failure loop
            await sleep_1.sleep(500);
        }
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