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
    sequelize.afterCreate((instance, options) => gqlCreateHook(pubSub, instance, options));
    sequelize.afterUpdate((instance, options) => gqlUpdateHook(pubSub, instance, options));
    // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}
exports.linkSequelizeToPubSubEngine = linkSequelizeToPubSubEngine;
/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/
// The Resolvers will convert to a Gql subscription
function gqlCreateHook(pubSub, instance, options) {
    const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.CREATED, instance);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
function gqlUpdateHook(pubSub, instance, options) {
    const payload = new node_notification_1.DbModelChangeNotification(node_notification_1.NotificationOf.UPDATED, instance);
    pubSub.publish(node_notification_1.NODE_CHANGE_NOTIFICATION, payload);
    // Also publish the specific Model
    pubSub.publish(`${node_notification_1.NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
//# sourceMappingURL=gql_pubsub_sequelize_engine.js.map