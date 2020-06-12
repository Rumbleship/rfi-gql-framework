import { Model, Sequelize } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { ClassType } from './../../helpers/classtype';
import { ModelDelta, NotificationOf, RfiSubscriptionOptions } from '../../gql';
import { RfiPubSubConfig } from '../config';
import { DbModelAndOidScope } from './init-sequelize';
import { RfiPubSubEngine } from './rfi-pub-sub-engine.interface';
export declare class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
    protected topicPrefix: string;
    publisher_version: string;
    protected subscription_ids: number[];
    protected beeline_cls: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline;
    constructor(publisher_version: string, config: RfiPubSubConfig, beeline: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline);
    static validatePubSubConfig(config: RfiPubSubConfig): void;
    /**
     *
     * @param {Sequelize } sequelize
     *
     * @description Attaches global model hooks, respecting transactions, to th
     */
    linkToSequelize(sequelize: Sequelize): void;
    getMarshalledTraceContext(trace_id: string): string;
    publish(triggerName: string, payload: any): Promise<void>;
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
    publishModelChange(notification: NotificationOf, model: Model, deltas: ModelDelta[], context_id?: string): void;
    deleteCurrentSubscriptionsMatchingPrefix(): Promise<void>;
    createSubscriptionsFor(dbModels: DbModelAndOidScope[]): Promise<void>;
    private createTopicIfNotExist;
}
