import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model, CreateOptions, UpdateOptions } from 'sequelize';
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
  attachPubSubEngineToSequelize(pubSub, sequelize);

  sequelize.afterCreate((instance, options) => gqlCreateHook(pubSub, instance, options));
  sequelize.afterUpdate((instance, options) => gqlUpdateHook(pubSub, instance, options));
  sequelize.addHook('afterAssociate' as any, () => {
    // tslint:disable-next-line: no-console
    console.log('hmmm');
  });
  // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}

const PubSubKey = Symbol('PubSubEngine');
function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
  Reflect.set(sequelize, PubSubKey, pubSub);
}
export function pubSubFrom(sequelize: Sequelize): PubSubEngine | null {
  const pubSub = Reflect.get(sequelize, PubSubKey);
  return pubSub ? pubSub : null;
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
function gqlUpdateHook(pubSub: PubSubEngine, instance: Model<any, any>, options: UpdateOptions) {
  const payload = new DbModelChangeNotification(NotificationOf.UPDATED, instance);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);
  // Also publish the specific Model
  pubSub.publish(`${NODE_CHANGE_NOTIFICATION}_${instance.constructor.name}`, payload);
}
