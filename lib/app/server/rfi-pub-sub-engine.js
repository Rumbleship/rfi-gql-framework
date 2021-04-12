"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSub = void 0;
const P = require("bluebird");
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const os_1 = require("os");
const o11y_1 = require("@rumbleship/o11y");
const gql_1 = require("../../gql");
const init_sequelize_1 = require("./init-sequelize");
const unique_subscription_name_part_1 = require("./unique-subscription-name-part");
const rumbleship_context_1 = require("../rumbleship-context");
const uuid = require("uuid");
const topic_name_1 = require("./topic-name");
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
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(publisher_version, serviceName, config, auth, beeline) {
        super(auth, unique_subscription_name_part_1.uniqueSubscriptionNamePart);
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
    linkToSequelize(sequelize) {
        const hookCb = (pubSub, notification_of) => {
            return function publisherHook(sequelize_instance, options) {
                var _a;
                // A slight incompatibility between types defined in `sequelize-typescript` and parent `sequelize`:
                // definition of the instance passed to the hooks, so we cast to generic Model<any,any>
                const instance = sequelize_instance;
                if (!Reflect.getMetadata(RfiPubSub.DONT_PUBLISH_ON_CHANGE_FLAG_SYMBOL, instance.constructor)) {
                    // Cache the delta of change in closure so we can publish original values __after__ the
                    // commit, which overwrites those original values.
                    const deltas = getChangedAttributes(instance);
                    if (options && options.transaction) {
                        const outermost_transaction = RfiPubSub.getOutermostTransaction(options.transaction);
                        const context_id = rumbleship_context_1.getContextId(outermost_transaction);
                        const authorized_user = rumbleship_context_1.getAuthorizedUser(outermost_transaction);
                        outermost_transaction.afterCommit(t => {
                            pubSub.publishModelChange(notification_of, uuid.v4(), instance, deltas, context_id, authorized_user);
                        });
                    }
                    else {
                        const beeline = o11y_1.RumbleshipBeeline.make(uuid.v4());
                        beeline.finishTrace(beeline.startTrace({
                            name: 'MissingTransaction',
                            'instance.id': instance.id,
                            'instance.constructor': (_a = instance === null || instance === void 0 ? void 0 : instance.constructor) === null || _a === void 0 ? void 0 : _a.name,
                            'instance.deltas': deltas,
                            notification_of
                        }));
                        pubSub.publishModelChange(notification_of, uuid.v4(), instance, deltas);
                    }
                }
            };
        };
        sequelize.afterCreate(hookCb(this, gql_1.NotificationOf.CREATED));
        sequelize.afterUpdate(hookCb(this, gql_1.NotificationOf.UPDATED));
        // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
    }
    /**
     *
     * @param { Sequelize.Transaction } transaction the current transaction, which may be a child of other transactions
     * @returns { Sequelize.Transaction } the outermost wrapping transaction of the transaction that was passed.
     *
     * @usage walk up the tree of nested transactions to find the outermost. Useful for finding the last transaction to
     * be finished, and attaching hooks to *it*.
     */
    static getOutermostTransaction(transaction) {
        let outer_transaction = transaction; // `as any`: sequelize + sequelize-typescript manage types badly at this level.
        while (outer_transaction.transaction) {
            outer_transaction = outer_transaction.transaction;
        }
        return outer_transaction;
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
        // the superclass subscribe uses uniqueSubscriptionNamePart() in the subscribe to find the name
        // of the subscription to use, and that function takes the SubscriptionOptions and creates the appropriate suscription name
        // depending on the asService option
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
        // the googlePubSub lib uses the
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
    publishModelChange(notification, idempotency_key, model, deltas, context_id, authorized_user) {
        const rval = payloadFromModel(model);
        rval.action = notification;
        rval.idempotency_key = idempotency_key;
        rval.deltas = deltas;
        rval.publisher_version = this.publisher_version;
        rval.marshalled_trace = context_id ? this.getMarshalledTraceContext(context_id) : undefined;
        rval.authorized_user = authorized_user;
        rval.publisher_service_name = this.serviceName;
        const payload = JSON.stringify(rval);
        const oidScope = init_sequelize_1.getScopeFor(model);
        // const topicName = `${NODE_CHANGE_NOTIFICATION}_${oidScope}_${this.publisher_version}`;
        const version_scoped_topic_name = topic_name_1.triggerName(this.publisher_version);
        const model_scoped_topic_name = topic_name_1.triggerName(this.publisher_version, oidScope);
        // Publish the change on most generic topic
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.publish(version_scoped_topic_name, payload);
        // Also publish the change topic specific to _this_ model
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.publish(model_scoped_topic_name, payload);
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
            const model_scoped_topic_name = topic_name_1.triggerName(this.publisher_version, scope, this.topicPrefix);
            await this.createTopicIfNotExist(model_scoped_topic_name);
            await this.pubSubClient
                .topic(model_scoped_topic_name)
                .createSubscription(model_scoped_topic_name + `-${os_1.hostname()}`);
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
RfiPubSub.DONT_PUBLISH_ON_CHANGE_FLAG_SYMBOL = Symbol('DONT_PUBLISH_ON_CHANGE_FLAG_SYMBOL');
function payloadFromModel(model) {
    const modelId = model === null || model === void 0 ? void 0 : model.get('id');
    const oid = init_sequelize_1.getOidFor(model).toString();
    return { oid, id: modelId };
}
function getChangedAttributes(instance) {
    const deltas = [];
    const values = instance.get({ plain: true });
    for (const key in values) {
        // eslint-disable-next-line no-prototype-builtins
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