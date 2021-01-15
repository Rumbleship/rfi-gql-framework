import { ISharedSchema } from '@rumbleship/config';
import { ClassType } from '../../../helpers';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { QueuedSubscriptionMessage } from '../../servers';
import { RfiPubSubSubscription } from '../../shared';
import { QueuedGqlRequestClientSingleInstanceResponder } from '../gql-request/queued-gql-request-client';
import { QueuedSubscriptionHandler } from './q_s_observer';
/**
 * Each service has its own pubsub topic that subscription responses are sent to. We subscribe to this
 * topic using a 'service' subscription (ie each message is handled by a single instance)
 *
 * On initialization, we send out all the QSR's defined in the observers on a createOrUpdate mutation to
 * ensure that the Qsr Managament service has the latest version of a Qsr and the responding service is updated
 *
 */
export declare class QueuedSubscriptionObserverManager {
    config: ISharedSchema;
    protected observers: readonly ClassType<Record<string, any>>[];
    qsr_subscription: RfiPubSubSubscription<QueuedSubscriptionMessage>;
    qsrTopicName: string;
    qsrSubscriptionName: string;
    handlers: Map<string, QueuedSubscriptionHandler>;
    _initialized: boolean;
    queuedGqlRequestClient: QueuedGqlRequestClientSingleInstanceResponder;
    constructor(config: ISharedSchema, observers: readonly ClassType<Record<string, any>>[]);
    setHandlers(observers: readonly ClassType<Record<string, any>>[]): void;
    init(ctx: RumbleshipContext): Promise<void>;
    /**
     * This function takes all the decorated Qso metadata and creates
     * QSR definitions that are then sent to the qsr system if then are new,
     * they are created, if needed they are updated.
     *
     * Any change will be broadcast to all the Qsr's services and the running
     * QSR will be updated or created
     */
    syncQsrs(ctx: RumbleshipContext): Promise<void>;
    start(_ctx: RumbleshipContext): Promise<void>;
    stop(ctx: RumbleshipContext): Promise<void>;
    /**
     *
     * @param ctx
     * @param response
     */
    message_dispatcher(ctx: RumbleshipContext, message: QueuedSubscriptionMessage): Promise<void>;
}
