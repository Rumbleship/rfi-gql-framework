import { Model, Sequelize } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { IPubSubConfig, IGcpAuthConfig } from '@rumbleship/config';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { ClassType } from './../../helpers/classtype';
import { ModelDelta, NotificationOf } from '../../gql';
import { DbModelAndOidScope } from './init-sequelize';
import { RfiPubSubEngine, RfiSubscriptionOptions } from './rfi-pub-sub-engine.interface';
/**
 * @NOTE This pubsub is used for both websocket graphql subscriptions (eg playground, ApolloClient)
 * as well as graphql subscriptions delivered over a google pubsub topic. Eg 'QueuedSubscriptions'
 *
 * See the subscribe function and the QueuedSubscriptionServer for details of why and how.
 *
 * TL;DR
 * when the runtime 'context' for a graphql subscription has an isQueuedSubscription flag set, then
 * we will append 'queued' in front of the topic to subscribe to via the typeGraphQl @Subscription
 * and @RumbleshipSubscription decorator.
 *
 * @See RumbleshipSubscription
 *
 *
 */
export declare class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
    static DONT_PUBLISH_ON_CHANGE_FLAG_SYMBOL: symbol;
    protected topicPrefix: string;
    protected serviceName: string;
    publisher_version: string;
    protected subscription_ids: number[];
    protected beeline_cls: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline;
    constructor(publisher_version: string, serviceName: string, config: IPubSubConfig, auth: IGcpAuthConfig, beeline: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline);
    /**
     *
     * @param {Sequelize } sequelize
     *
     * @description Attaches global model hooks, respecting transactions, to th
     */
    linkToSequelize(sequelize: Sequelize): void;
    /**
     *
     * @param { Sequelize.Transaction } transaction the current transaction, which may be a child of other transactions
     * @returns { Sequelize.Transaction } the outermost wrapping transaction of the transaction that was passed.
     *
     * @usage walk up the tree of nested transactions to find the outermost. Useful for finding the last transaction to
     * be finished, and attaching hooks to *it*.
     */
    private static getOutermostTransaction;
    getMarshalledTraceContext(context_id: string): string;
    publish(triggerName: string, payload: string): Promise<void>;
    subscribe(triggerName: string, onMessage: (message: string) => null, options?: RfiSubscriptionOptions): Promise<number>;
    unsubscribe(subId: number): void;
    unsubscribeAll(): void;
    /**
     *
     * @param notification
     * @param model
     * @param deltas
     *
     * @note This triggers floating promises which is explicity does not await!
     */
    publishModelChange(notification: NotificationOf, idempotency_key: string, model: Model, deltas: ModelDelta[], context_id?: string, authorized_user?: string): void;
    deleteCurrentSubscriptionsMatchingPrefix(): Promise<void>;
    createSubscriptionsFor(dbModels: DbModelAndOidScope[]): Promise<void>;
    private createTopicIfNotExist;
}
