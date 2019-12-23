"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_notification_1 = require("../gql/node-notification");
//import {
//  //initGooglePubSub,
//  publishPayloadToPubSub,
//} from '../pubsub';
const PubSubKey = Symbol('PubSubEngine');
// TODO - figure out why these have to live here; something to do with symbol maybe
//function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
function attachPubSubEngineToSequelize(pubSub, sequelize) {
    Reflect.set(sequelize, PubSubKey, pubSub);
}
///export function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | PubSubEngine | null {
//export function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null {
function pubSubFrom(sequelize) {
    const pubSub = Reflect.get(sequelize, PubSubKey);
    return pubSub ? pubSub : null;
}
exports.pubSubFrom = pubSubFrom;
/**
import {
  attachPubSubEngineToSequelize,
//  pub
} from '../src/pubsub/helper';
**/
// getTopics being async forces the whole chain to be async, which doesn't help
// how much there's a race going on
/**
 *
 */
function linkSequelizeToPubSubEngine(pubSub, sequelize) {
    // Install hooks on Sequelize that publish GqlNodeNotifications
    // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
    // GQL classes
    // FIXME - is this the right place for this?
    // where wants to be aware that we're doing google pub sub?
    // also libraryize
    // cant await this fn either
    attachPubSubEngineToSequelize(pubSub, sequelize);
    sequelize.afterCreate((instance, options) => {
        // Cache the previous values to closure so they can be published __after__ commit
        // (the previous vales will be overwritten on commit)
        const deltas = getChangedAttributes(instance);
        if (options && options.transaction) {
            options.transaction.afterCommit(t => gqlCreateHook(pubSub, instance, deltas, options));
            return;
        }
        gqlCreateHook(pubSub, instance, deltas, options);
    });
    sequelize.afterUpdate((instance, options) => {
        const deltas = getChangedAttributes(instance);
        if (options && options.transaction) {
            options.transaction.afterCommit(t => gqlUpdateHook(pubSub, instance, deltas, options));
            return;
        }
        gqlUpdateHook(pubSub, instance, deltas, options);
    });
    // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
}
exports.linkSequelizeToPubSubEngine = linkSequelizeToPubSubEngine;
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
function publishCurrentState(instance) {
    const pubSub = pubSubFrom(instance.sequelize);
    if (pubSub)
        pubSub.publishPayload(node_notification_1.NotificationOf.LAST_KNOWN_STATE, instance, []);
}
exports.publishCurrentState = publishCurrentState;
/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/
// The Resolvers will convert to a Gql subscription
function gqlCreateHook(pubSub, instance, deltas, options) {
    pubSub.publishPayload(node_notification_1.NotificationOf.LAST_KNOWN_STATE, instance, []);
}
function gqlUpdateHook(pubSub, instance, deltas, options) {
    pubSub.publishPayload(node_notification_1.NotificationOf.LAST_KNOWN_STATE, instance, []);
}
//# sourceMappingURL=gql-pubsub-sequelize-engine.js.map