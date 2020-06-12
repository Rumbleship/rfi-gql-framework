import * as P from 'bluebird';
import { Model, Sequelize } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { hostname } from 'os';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { ClassType } from './../../helpers/classtype';
import {
  ModelDelta,
  NotificationOf,
  RfiSubscriptionOptions,
  uniqueSubscriptionNamePart,
  NODE_CHANGE_NOTIFICATION
} from '../../gql';
import { RfiPubSubConfig } from '../config';
import { DbModelAndOidScope, getOidFor, getScopeFor } from './init-sequelize';
import { RfiPubSubEngine, Payload } from './rfi-pub-sub-engine.interface';

import { CreateOptions, UpdateOptions, Model as SequelizeModel } from 'sequelize';
import { getContextId } from '../rumbleship-context';
export class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
  protected topicPrefix: string;
  public publisher_version: string;
  protected subscription_ids: number[];
  protected beeline_cls: ClassType<RumbleshipBeeline>;
  constructor(
    publisher_version: string,
    config: RfiPubSubConfig,
    beeline: ClassType<RumbleshipBeeline>
  ) {
    RfiPubSub.validatePubSubConfig(config);
    const { topicPrefix, keyFilename } = config;
    super(keyFilename === `/dev/null` ? {} : config, uniqueSubscriptionNamePart);
    this.topicPrefix = topicPrefix;
    this.publisher_version = publisher_version;
    this.beeline_cls = beeline;
    this.subscription_ids = [];
  }

  static validatePubSubConfig(config: RfiPubSubConfig) {
    if (['test', 'development'].includes(process.env.NODE_ENV as string)) {
      if (['test', 'development'].includes(config.topicPrefix)) {
        /**
         * Each instance of a dev environment (which really means each instance of the database)
         * e.g. when running locally needs to have a prefix for the topics so they dont clash with others
         * as we share a development queue in GCP pub sub
         *
         * Alternatively, use an emulator!
         */
        throw new Error(
          'PubSubConfig.topicPrefix MUST be set to a non-clashing value i.e your username.: See @rumbleship/gql: RfiPubSub'
        );
      }
    }
  }

  /**
   *
   * @param {Sequelize } sequelize
   *
   * @description Attaches global model hooks, respecting transactions, to th
   */
  public linkToSequelize(sequelize: Sequelize) {
    const hookCb = (notification_of: NotificationOf) => {
      return function publisherHook(
        this: RfiPubSub,
        sequelize_instance: SequelizeModel<any, any>,
        options: CreateOptions | UpdateOptions
      ) {
        // A slight incompatibility between types defined in `sequelize-typescript` and parent `sequelize`:
        // definition of the instance passed to the hooks, so we cast to generic Model<any,any>
        const instance = sequelize_instance as Model<any, any>;
        // Cache the delta of change in closure so we can publish original values __after__ the
        // commit, which overwrites those original values.
        const deltas = getChangedAttributes(instance);

        if (options && options.transaction) {
          const context_id = getContextId(options.transaction);
          options.transaction.afterCommit(t => {
            this.publishModelChange(notification_of, instance, deltas, context_id);
          });
        } else {
          this.publishModelChange(notification_of, instance, deltas);
        }
      };
    };

    sequelize.afterCreate(hookCb(NotificationOf.CREATED));
    sequelize.afterUpdate(hookCb(NotificationOf.UPDATED));
    // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
  }

  public getMarshalledTraceContext(trace_id: string): string {
    return this.beeline_cls.prototype.bindFuntionToTrace(
      () => this.beeline_cls.prototype.getContext(),
      trace_id
    )();
  }

  public async publish(triggerName: string, payload: any): Promise<void> {
    const topicName = `${this.topicPrefix}_${triggerName}`;
    await this.createTopicIfNotExist(topicName);
    return super.publish(topicName, payload);
  }

  public async subscribe(
    triggerName: string,
    onMessage: (message: string) => null,
    options?: RfiSubscriptionOptions
  ): Promise<number> {
    const topicName = `${this.topicPrefix}_${triggerName}`;
    await this.createTopicIfNotExist(topicName);
    const sub_id = await super.subscribe(topicName, onMessage, options);
    this.subscription_ids.push(sub_id);
    return sub_id;
  }

  public unsubscribe(subId: number): void {
    this.subscription_ids = this.subscription_ids.filter(id => id !== subId);
    super.unsubscribe(subId);
  }

  unsubscribeAll(): void {
    // Googlepub sub supposedly stops polling for events when there are no more listeners
    for (const id of this.subscription_ids) {
      super.unsubscribe(id);
    }
    this.subscription_ids = [];
  }

  /**
   *
   * @param notification
   * @param model
   * @param deltas
   *
   * @note This triggers floating promises which is explicity does not await!
   */
  publishModelChange(
    notification: NotificationOf,
    model: Model,
    deltas: ModelDelta[],
    context_id?: string
  ): void {
    const rval = payloadFromModel(model) as Payload;
    rval.action = notification;
    rval.deltas = deltas;
    rval.publisher_version = this.publisher_version;
    rval.marshalled_trace = context_id ? this.getMarshalledTraceContext(context_id) : undefined;

    const payload = JSON.stringify(rval);

    const oidScope = getScopeFor(model);
    const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${oidScope}`;

    // Publish the change on most generic topic
    // tslint:disable-next-line: no-floating-promises
    this.publish(NODE_CHANGE_NOTIFICATION, payload);

    // Also publish the change topic specific to _this_ model
    // tslint:disable-next-line: no-floating-promises
    this.publish(topicName, payload);
  }

  public async deleteCurrentSubscriptionsMatchingPrefix() {
    const [subscriptions] = await this.pubSubClient.getSubscriptions();
    const mySubscriptions = subscriptions.filter((s: any) =>
      s.name.match(new RegExp(`${this.topicPrefix}`))
    );
    await P.map(mySubscriptions, async subscription => {
      const { name } = subscription as any;
      await this.pubSubClient.subscription(name).delete();
    });
  }

  public async createSubscriptionsFor(dbModels: DbModelAndOidScope[]) {
    await P.map(dbModels, async ({ scope }) => {
      const triggerName = `${this.topicPrefix}_NODE_CHANGE_NOTIFICATION_${scope}`;
      await this.createTopicIfNotExist(triggerName);
      await this.pubSubClient.topic(triggerName).createSubscription(triggerName + `-${hostname()}`);
    });
  }

  private async createTopicIfNotExist(topicName: string): Promise<void> {
    const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
    const topic = this.pubSubClient.topic(topicName);
    const [exists] = await topic.exists();
    if (!exists) {
      try {
        await this.pubSubClient.createTopic(topicName);
      } catch (e) {
        if (!(e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER)) {
          // A topic can be created many times concurrently; Google only lets one get created
          // and throws a specific error for those that fail. Only rethrow.
          throw e;
        }
      }
    }
  }
}

function payloadFromModel(model: Model): { oid: string; id: string } {
  const modelId = model?.get('id') as string;
  const oid = getOidFor(model).toString();
  return { oid, id: modelId };
}

function getChangedAttributes(instance: Model<any, any>): ModelDelta[] {
  const deltas: ModelDelta[] = [];
  const values = instance.get({ plain: true });
  for (const key in values) {
    if (values.hasOwnProperty(key)) {
      if (instance.changed(key as any)) {
        const delta: ModelDelta = {
          key,
          previousValue: instance.previous(key as any),
          newValue: instance.get(key as any)
        };
        deltas.push(delta);
      }
    }
  }
  return deltas;
}
