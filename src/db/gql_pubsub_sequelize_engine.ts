import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions } from 'sequelize';
import {
  NotificationOf,
  DbModelChangeNotification,
  NODE_CHANGE_NOTIFICATION
} from '../gql/node-notification';

/**
 *
 */
export function linkSequelizeToPubSubEngine(pubSub: PubSubEngine, sequelize: Sequelize) {
  // Install hooks on Sequelize that publish GqlNodeNotifications
  // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
  // GQL classes

  sequelize.afterCreate((instance, options) => gqlCreateHook(pubSub, instance, options));
  sequelize.afterUpdate((instance, options) => gqlUpdateHook(pubSub, instance, options));

  // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}

/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/

// The Resolvers will convert to a Gql subscription
function gqlCreateHook(pubSub: PubSubEngine, instance: Model<any, any>, options: CreateOptions) {
  const payload = new DbModelChangeNotification(NotificationOf.CREATED, instance);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  // Also publish the specific Model
  pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
function gqlUpdateHook(pubSub: PubSubEngine, instance: Model<any, any>, options: CreateOptions) {
  const payload = new DbModelChangeNotification(NotificationOf.UPDATED, instance);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  // Also publish the specific Model
  pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
