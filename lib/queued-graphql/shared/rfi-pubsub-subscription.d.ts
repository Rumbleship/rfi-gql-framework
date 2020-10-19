import { Subscription, PubSub as GooglePubSub, Message } from '@google-cloud/pubsub';
import { SpyglassLogger } from '@rumbleship/spyglass';
import { SubscriberOptions } from '@google-cloud/pubsub/build/src/subscriber';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
export declare class RfiPubSubSubscription<T> {
    protected _pubSub: GooglePubSub;
    protected delete_on_stop: boolean;
    protected subscriber_options?: SubscriberOptions | undefined;
    protected _initiaized: boolean;
    private _subscription;
    protected topic_name: string;
    protected subscription_name: string;
    protected logger: SpyglassLogger;
    constructor(config: ISharedSchema, _pubSub: GooglePubSub, topic_name: string, subscription_name: string, delete_on_stop: boolean, subscriber_options?: SubscriberOptions | undefined);
    init(): Promise<void>;
    protected initSubscription(): Promise<Subscription>;
    start(handler: (ctx: RumbleshipContext, payload: T) => Promise<void>, source_name?: string): Promise<void>;
    parseMessage(message_data: string): T | undefined;
    stop(): Promise<void>;
    /**
     * sets up listener and turns it into an AsyncIterableIterator
     * for use in for await ( const message of this.messages ) {}
     *
     * Clean event queue, but make sure that message.ack() is called
     * and if the message processing may take some time, may need to adjust the google
     * pubsub
     *
     */
    get messages(): AsyncIterableIterator<Message[]>;
}
