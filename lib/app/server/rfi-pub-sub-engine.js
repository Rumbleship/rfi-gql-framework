"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiPubSub = void 0;
const P = require("bluebird");
const graphql_google_pubsub_1 = require("@axelspringer/graphql-google-pubsub");
const os_1 = require("os");
const o11y_1 = require("@rumbleship/o11y");
const gql_1 = require("../../gql");
const init_sequelize_1 = require("./init-sequelize");
const rumbleship_context_1 = require("../rumbleship-context");
const uuid = require("uuid");
/**
 * @NOTE THIS IS IS ONLY FOR CLIENT SUBSCRIPTIONS
 */
class RfiPubSub extends graphql_google_pubsub_1.GooglePubSub {
    constructor(publisher_version, config, auth, beeline) {
        // RfiPubSub.validatePubSubConfig(config);
        super(auth, gql_1.uniqueSubscriptionNamePart);
        this.topicPrefix = config.topicPrefix;
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
                var _a;
                // A slight incompatibility between types defined in `sequelize-typescript` and parent `sequelize`:
                // definition of the instance passed to the hooks, so we cast to generic Model<any,any>
                const instance = sequelize_instance;
                // Cache the delta of change in closure so we can publish original values __after__ the
                // commit, which overwrites those original values.
                const deltas = getChangedAttributes(instance);
                if (options && options.transaction) {
                    const outermost_transaction = RfiPubSub.getOutermostTransaction(options.transaction);
                    const context_id = rumbleship_context_1.getContextId(outermost_transaction);
                    const authorized_user = rumbleship_context_1.getAuthorizedUser(outermost_transaction);
                    outermost_transaction.afterCommit(t => {
                        pubSub.publishModelChange(notification_of, instance, deltas, context_id, authorized_user);
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
                    pubSub.publishModelChange(notification_of, instance, deltas);
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
        const topicName = `${this.topicPrefix}_${triggerName}`;
        await this.createTopicIfNotExist(topicName);
        const sub_id = await super.subscribe(topicName, onMessage, options);
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
    publishModelChange(notification, model, deltas, context_id, authorized_user) {
        const rval = payloadFromModel(model);
        rval.action = notification;
        rval.deltas = deltas;
        rval.publisher_version = this.publisher_version;
        rval.marshalled_trace = context_id ? this.getMarshalledTraceContext(context_id) : undefined;
        rval.authorized_user = authorized_user;
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