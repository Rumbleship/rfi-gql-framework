"use strict";
// /**
//  *
//  * @param pubSub
//  * @param sequelize
//  *
//  * @description Install `afterCreate` and `afterUpdate` hooks on Sequelize instance to publish
//  * over changes to the queue.
//  */
// export function linkSequelizeToPubSubEngine(pubSub: RfiPubSubEngine, sequelize: Sequelize) {
//   attachPubSubEngineToSequelize(pubSub, sequelize);
//   const hookCb = (notification_of: NotificationOf) => {
//     return function publisherHook(
//       sequelize_instance: SequelizeModel<any, any>,
//       options: CreateOptions | UpdateOptions
//     ) {
//       // A slight incompatibility between types defined in `sequelize-typescript` and parent `sequelize`:
//       // definition of the instance passed to the hooks, so we cast to generic Model<any,any>
//       const instance = sequelize_instance as Model<any, any>;
//       // Cache the delta of change in closure so we can publish original values __after__ the
//       // commit, which overwrites those original values.
//       const deltas = getChangedAttributes(instance as Model<any, any>);
//       if (options && options.transaction) {
//         options.transaction.afterCommit(t => {
//           pubSub.publishPayload(notification_of, instance as Model<any, any>, deltas);
//         });
//       } else {
//         pubSub.publishPayload(notification_of, instance as Model<any, any>, deltas);
//       }
//     };
//   };
//   sequelize.afterCreate(hookCb(NotificationOf.CREATED));
//   sequelize.afterUpdate(hookCb(NotificationOf.UPDATED));
//   // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
// }
// function getChangedAttributes(instance: Model<any, any>): ModelDelta[] {
//   const deltas: ModelDelta[] = [];
//   const values = instance.get({ plain: true });
//   for (const key in values) {
//     if (values.hasOwnProperty(key)) {
//       if (instance.changed(key as any)) {
//         const delta: ModelDelta = {
//           key,
//           previousValue: instance.previous(key as any),
//           newValue: instance.get(key as any)
//         };
//         deltas.push(delta);
//       }
//     }
//   }
//   return deltas;
// }
// export function publishCurrentState(instance: Model<any, any>) {
//   const pubSub = pubSubFrom(instance.sequelize as Sequelize);
//   if (pubSub) {
//     pubSub.publishPayload(NotificationOf.LAST_KNOWN_STATE, instance, []);
//   }
// }
// // It would not compile/run if I moved these under pubsub
// function attachPubSubEngineToSequelize(pubSub: RfiPubSubEngine, sequelize: Sequelize): void {
// }
// function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null {
//   const pubSub = Reflect.get(sequelize, PubSubKey);
//   return pubSub ? pubSub : null;
// }
//# sourceMappingURL=init-pubsub-sequelize-engine.js.map