import * as P from 'bluebird';
import { Model, Sequelize } from 'sequelize-typescript';
import { GooglePubSub } from '@axelspringer/graphql-google-pubsub';
import { hostname } from 'os';
import { IPubSubConfig, IGcpAuthConfig } from '@rumbleship/config';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { ClassType } from './../../helpers/classtype';
import { ModelDelta, NotificationOf, NODE_CHANGE_NOTIFICATION } from '../../gql';
import { DbModelAndOidScope, getOidFor, getScopeFor } from './init-sequelize';
import {
  RfiPubSubEngine,
  NodeChangePayload,
  RfiSubscriptionOptions
} from './rfi-pub-sub-engine.interface';

import { CreateOptions, UpdateOptions, Model as SequelizeModel } from 'sequelize';
import { uniqueSubscriptionNamePart } from './unique-subscription-name-part';
import { getContextId, getAuthorizedUser } from '../rumbleship-context';
import uuid = require('uuid');
/**
 * @NOTE THIS IS IS ONLY FOR CLIENT SUBSCRIPTIONS
 */
export class RfiPubSub extends GooglePubSub implements RfiPubSubEngine {
  protected topicPrefix: string;
  protected serviceName: string;
  public publisher_version: string;
  protected subscription_ids: number[];
  protected beeline_cls: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline;
  constructor(
    publisher_version: string,
    serviceName: string,
    config: IPubSubConfig,
    auth: IGcpAuthConfig,
    beeline: ClassType<RumbleshipBeeline> & typeof RumbleshipBeeline
  ) {
    super(auth, uniqueSubscriptionNamePart);
    this.topicPrefix = config.topicPrefix;
    this.serviceName = serviceName;
    this.publisher_version = publisher_version;
    this.beeline_cls = beeline;
    this.subscription_ids = [];
  }

  /**
   *
   * @param {Sequelize } sequelize
   *
   * @description Attaches global model hooks, respecting transactions, to th
   */
  public linkToSequelize(sequelize: Sequelize) {
    const hookCb = (pubSub: RfiPubSub, notification_of: NotificationOf) => {
      return function publisherHook(
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
          const authorized_user = getAuthorizedUser(options.transaction);
          options.transaction.afterCommit(t => {
            pubSub.publishModelChange(
              notification_of,
              uuid.v4(),
              instance,
              deltas,
              context_id,
              authorized_user
            );
          });
        } else {
          const beeline = RumbleshipBeeline.make(uuid.v4());
          beeline.finishTrace(
            beeline.startTrace({
              name: 'MissingTransaction',
              'instance.id': instance.id,
              'instance.constructor': instance?.constructor?.name,
              'instance.deltas': deltas,
              notification_of
            })
          );
          pubSub.publishModelChange(notification_of, uuid.v4(), instance, deltas);
        }
      };
    };

    sequelize.afterCreate(hookCb(this, NotificationOf.CREATED));
    sequelize.afterUpdate(hookCb(this, NotificationOf.UPDATED));
    // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
  }

  public getMarshalledTraceContext(context_id: string): string {
    return this.beeline_cls.marshalTraceContext(this.beeline_cls.getTraceContext(context_id));
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
    // This function is called deep within the type-graphql library, and
    // there is no way to pass in the 'options'
    //
    // So we distinguish what type of subscription to do via
    // a naming convention on the trigger name. Basically, do we want a unique subscription or a shared subscription
    //
    // If the triggerName passed in beginning in 'queued_...' means a service type subscription, i.e. it
    // acts liker a classic 'worker queue' where each instance that is subscribes gets
    // ie we share the subscription across all instances of this service.. On one of which will be notified of an
    // message published to the underlyging topic
    // the superclass subscribe uses uniqueSubscriptionNamePart() in the subscribe to find the name
    // of the subscription to use, and that function takes the SubscriptionOptions and creates the appropriate suscription name
    // depending on the asService option
    let topicName;
    const queuedString = 'queued-';
    let opts: RfiSubscriptionOptions = { ...options };
    if (triggerName.startsWith(queuedString)) {
      topicName = `${this.topicPrefix}_${triggerName.substring(queuedString.length)}`;

      opts = { ...options, asService: true, serviceName: `queued-${this.serviceName}` };
    } else {
      topicName = `${this.topicPrefix}_${triggerName}`;
    }
    await this.createTopicIfNotExist(topicName);
    // the googlePubSub lib uses the
    const sub_id = await super.subscribe(topicName, onMessage, opts);
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
    idempotency_key: string,
    model: Model,
    deltas: ModelDelta[],
    context_id?: string,
    authorized_user?: string
  ): void {
    const rval = payloadFromModel(model) as NodeChangePayload;
    rval.action = notification;
    rval.idempotency_key = idempotency_key;
    rval.deltas = deltas;
    rval.publisher_version = this.publisher_version;
    rval.marshalled_trace = context_id ? this.getMarshalledTraceContext(context_id) : undefined;
    rval.authorized_user = authorized_user;

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
