import { Subscription, PubSub as GooglePubSub, Message } from '@google-cloud/pubsub';
import { SpyglassLogger } from '@rumbleship/spyglass';
import { SubscriberOptions } from '@google-cloud/pubsub/build/src/subscriber';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { ISharedSchema } from '@rumbleship/config';
import { RumbleshipBeeline } from '@rumbleship/o11y';
export declare class RfiPubSubSubscription<T> {
    protected _pubSub: GooglePubSub;
    protected delete_on_stop: boolean;
    protected subscriber_options?: SubscriberOptions | undefined;
    protected _initiaized: boolean;
    private _subscription;
    protected gcloud_topic_name: string;
    protected gcloud_subscription_name: string;
    protected logger: SpyglassLogger;
    protected beeline: RumbleshipBeeline;
    constructor(config: ISharedSchema, _pubSub: GooglePubSub, gcloud_topic_name: string, gcloud_subscription_name: string, delete_on_stop: boolean, subscriber_options?: SubscriberOptions | undefined);
    init(): Promise<void>;
    protected initSubscription(): Promise<Subscription>;
    dispatch(message: Message, handler: (ctx: RumbleshipContext, payload: T) => Promise<void>): Promise<void>;
    start(handler: (ctx: RumbleshipContext, payload: T) => Promise<void>, source_name?: string): Promise<void>;
    /**
     *
     * @param handler
     * @param source_name
     * @returns {Promise<boolean>} whether or not the process should be restarted
     *
     * @note this function swallows errors and manages reporting them itself
     */
    private iterate;
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
