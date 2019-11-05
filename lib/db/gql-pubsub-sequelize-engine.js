"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_notification_1 = require("../gql/node-notification");
/**
 *
 */
function linkSequelizeToPubSubEngine(pubSub, sequelize) {
    // Install hooks on Sequelize that publish GqlNodeNotifications
    // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
    // GQL classes
    attachPubSubEngineToSequelize(pubSub, sequelize);
    sequelize.afterCreate((instance, options) => {
        // Cache the previous values to closure so they can be published __after__ commit
        // (the previous vales will be overwritten on commit)
        const previous = getChangedAttributes(instance);
        if (options && options.transaction) {
            options.transaction.afterCommit(t => gqlCreateHook(pubSub, instance, previous, options));
            return;
        }
        gqlCreateHook(pubSub, instance, previous, options);
    });
    sequelize.afterUpdate((instance, options) => {
        const previous = getChangedAttributes(instance);
        if (options && options.transaction) {
            options.transaction.afterCommit(t => gqlUpdateHook(pubSub, instance, previous, options));
            return;
        }
        gqlUpdateHook(pubSub, instance, previous, options);
    });
    // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}
exports.linkSequelizeToPubSubEngine = linkSequelizeToPubSubEngine;
function getChangedAttributes(instance) {
    const changed = instance.changed();
    const previous = {};
    changed.forEach(key => {
        Reflect.set(previous, key, instance.previous(key));
    });
    return previous;
}
function publishCurrentState(instance) {
    const pubSub = pubSubFrom(instance.sequelize);
    if (pubSub) {
        const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.LAST_KNOWN_STATE, instance);
        pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
        // Also publish the specific Model
        pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
    }
}
exports.publishCurrentState = publishCurrentState;
const PubSubKey = Symbol('PubSubEngine');
function attachPubSubEngineToSequelize(pubSub, sequelize) {
    Reflect.set(sequelize, PubSubKey, pubSub);
}
function pubSubFrom(sequelize) {
    const pubSub = Reflect.get(sequelize, PubSubKey);
    return pubSub ? pubSub : null;
}
exports.pubSubFrom = pubSubFrom;
/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/
// The Resolvers will convert to a Gql subscription
function gqlCreateHook(pubSub, instance, previous, options) {
    const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.CREATED, instance, previous);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
function gqlUpdateHook(pubSub, instance, previous, options) {
    const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.UPDATED, instance, previous);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
//# sourceMappingURL=gql-pubsub-sequelize-engine.js.map