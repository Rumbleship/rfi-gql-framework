"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSub = void 0;
const P = require("bluebird");
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const os_1 = require("os");
const gql_1 = require("../../gql");
const init_sequelize_1 = require("./init-sequelize");
const rumbleship_context_1 = require("../rumbleship-context");
/**
 * @NOTE THIS IS IS ONLY FOR CLIENT SUBSCRIPTIONS
 */
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(publisher_version, serviceName, config, auth, beeline) {
        // RfiPubSub.validatePubSubConfig(config);
        super(auth, gql_1.uniqueSubscriptionNamePart);
        this.topicPrefix = config.topicPrefix;
        this.serviceName = serviceName;
        this.publisher_version = publisher_version;
        this.beeline_cls = beeline;
        this.subscription_ids = [];
    }
    // static validatePubSubConfig(config: RfiPubSubConfig) {
    //   if (['test', 'development'].includes(process.env.NODE_ENV as string)) {
    //     if (['test', 'development'].includes(config.topicPrefix)) {
    //       /**
    //        * Each instance of a dev environment (which really means each instance of the database)
    //        * e.g. when running locally needs to have a prefix for the topics so they dont clash with others
    //        * as we share a development queue in GCP pub sub
    //        *
    //        * Alternatively, use an emulator!
    //        */
    //       throw new Error(
    //         'PubSub.topicPrefix MUST be set to a non-clashing value i.e your username.: See @rumbleship/gql: RfiPubSub'
    //       );
    //     }
    //   }
    // }
    /**
     *
     * @param {Sequelize } sequelize
     *
     * @description Attaches global model hooks, respecting transactions, to th
     */
    linkToSequelize(sequelize) {
        const hookCb = (pubSub, notification_of) => {
            return function publisherHook(sequelize_instance, options) {
                // A slight incompatibility between types defined in `sequelize-typescript` and parent `sequelize`:
                // definition of the instance passed to the hooks, so we cast to generic Model<any,any>
                const instance = sequelize_instance;
                // Cache the delta of change in closure so we can publish original values __after__ the
                // commit, which overwrites those original values.
                const deltas = getChangedAttributes(instance);
                if (options && options.transaction) {
                    const context_id = rumbleship_context_1.getContextId(options.transaction);
                    options.transaction.afterCommit(t => {
                        pubSub.publishModelChange(notification_of, instance, deltas, context_id);
                    });
                }
                else {
                    pubSub.publishModelChange(notification_of, instance, deltas);
                }
            };
        };
        sequelize.afterCreate(hookCb(this, gql_1.NotificationOf.CREATED));
        sequelize.afterUpdate(hookCb(this, gql_1.NotificationOf.UPDATED));
        // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
    }
    getMarshalledTraceContext(context_id) {
        return this.beeline_cls.marshalTraceContext(this.beeline_cls.getTraceContext(context_id));
    }
    async publish(triggerName, payload) {
        const topicName = `${this.topicPrefix}_${triggerName}`;
        await this.createTopicIfNotExist(topicName);
        return super.publish(topicName, payload);
    }
    async subscribe(triggerName, onMessage, options) {
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
        let topicName;
        const queuedString = 'queued-';
        let opts = { ...options };
        if (triggerName.startsWith(queuedString)) {
            topicName = `${this.topicPrefix}_${triggerName.substring(queuedString.length)}`;
            opts = { ...options, asService: true, serviceName: `queued-${this.serviceName}` };
        }
        else {
            topicName = `${this.topicPrefix}_${triggerName}`;
        }
        await this.createTopicIfNotExist(topicName);
        const sub_id = await super.subscribe(topicName, onMessage, opts);
        this.subscription_ids.push(sub_id);
        return sub_id;
    }
    unsubscribe(subId) {
        this.subscription_ids = this.subscription_ids.filter(id => id !== subId);
        super.unsubscribe(subId);
    }
    unsubscribeAll() {
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
    publishModelChange(notification, model, deltas, context_id) {
        const rval = payloadFromModel(model);
        rval.action = notification;
        rval.deltas = deltas;
        rval.publisher_version = this.publisher_version;
        rval.marshalled_trace = context_id ? this.getMarshalledTraceContext(context_id) : undefined;
        const payload = JSON.stringify(rval);
        const oidScope = init_sequelize_1.getScopeFor(model);
        const topicName = `${gql_1.NODE_CHANGE_NOTIFICATION}_${oidScope}`;
        // Publish the change on most generic topic
        // tslint:disable-next-line: no-floating-promises
        this.publish(gql_1.NODE_CHANGE_NOTIFICATION, payload);
        // Also publish the change topic specific to _this_ model
        // tslint:disable-next-line: no-floating-promises
        this.publish(topicName, payload);
    }
    async deleteCurrentSubscriptionsMatchingPrefix() {
        const [subscriptions] = await this.pubSubClient.getSubscriptions();
        const mySubscriptions = subscriptions.filter((s) => s.name.match(new RegExp(`${this.topicPrefix}`)));
        await P.map(mySubscriptions, async (subscription) => {
            const { name } = subscription;
            await this.pubSubClient.subscription(name).delete();
        });
    }
    async createSubscriptionsFor(dbModels) {
        await P.map(dbModels, async ({ scope }) => {
            const triggerName = `${this.topicPrefix}_NODE_CHANGE_NOTIFICATION_${scope}`;
            await this.createTopicIfNotExist(triggerName);
            await this.pubSubClient.topic(triggerName).createSubscription(triggerName + `-${os_1.hostname()}`);
        });
    }
    async createTopicIfNotExist(topicName) {
        const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
        const topic = this.pubSubClient.topic(topicName);
        const [exists] = await topic.exists();
        if (!exists) {
            try {
                await this.pubSubClient.createTopic(topicName);
            }
            catch (e) {
                if (!(e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER)) {
                    // A topic can be created many times concurrently; Google only lets one get created
                    // and throws a specific error for those that fail. Only rethrow.
                    throw e;
                }
            }
        }
    }
}
exports.RfiPubSub = RfiPubSub;
function payloadFromModel(model) {
    const modelId = model === null || model === void 0 ? void 0 : model.get('id');
    const oid = init_sequelize_1.getOidFor(model).toString();
    return { oid, id: modelId };
}
function getChangedAttributes(instance) {
    const deltas = [];
    const values = instance.get({ plain: true });
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            if (instance.changed(key)) {
                const delta = {
                    key,
                    previousValue: instance.previous(key),
                    newValue: instance.get(key)
                };
                deltas.push(delta);
            }
        }
    }
    return deltas;
}
//# sourceMappingURL=rfi-pub-sub-engine.js.map