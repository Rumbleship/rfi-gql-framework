import { RfiPubSubEngine } from '../pubsub';
import { Model, Sequelize } from 'sequelize-typescript';
import { CreateOptions, UpdateOptions } from 'sequelize';
import { NotificationOf, ModelDelta } from '../gql/node-notification';

/**
 *
 */
export function linkSequelizeToPubSubEngine(pubSub: RfiPubSubEngine, sequelize: Sequelize) {
  // Install hooks on Sequelize that publish GqlNodeNotifications
  // Takes advantage of the RFI frameworks connection of sequelize Model<> class to our
  // GQL classes
  attachPubSubEngineToSequelize(pubSub, sequelize);

  sequelize.afterCreate((instance, options) => {
    // Cache the previous values to closure so they can be published __after__ commit
    // (the previous vales will be overwritten on commit)
    // NOTE there is a slight incompatibility between the sequelize-typescript lib and sequelize in the type
    // definition of the instance passed to the hooks... It actually doesnt matter for now, so we assert to any
    //
    const deltas = getChangedAttributes(instance as any);

    if (options && options.transaction) {
      options.transaction.afterCommit(t => gqlCreateHook(pubSub, instance as any, deltas, options));
      return;
    }
    gqlCreateHook(pubSub, instance as any, deltas, options);
  });

  sequelize.afterUpdate((instance, options) => {
    const deltas = getChangedAttributes(instance as any);
    if (options && options.transaction) {
      options.transaction.afterCommit(t => gqlUpdateHook(pubSub, instance as any, deltas, options));
      return;
    }
    gqlUpdateHook(pubSub, instance as any, deltas, options);
  });
  // sequelize.afterBulkCreate((instances, options) => gqlBulkCreateHook(pubSub, instances, options));
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

export function publishCurrentState(instance: Model<any, any>) {
  const pubSub = pubSubFrom(instance.sequelize as Sequelize);
  if (pubSub) {
    pubSub.publishPayload(NotificationOf.LAST_KNOWN_STATE, instance, []);
  }
}

// It would not compile/run if I moved these under pubsub
const PubSubKey = Symbol('PubSubEngine');
function attachPubSubEngineToSequelize(pubSub: RfiPubSubEngine, sequelize: Sequelize): void {
  Reflect.set(sequelize, PubSubKey, pubSub);
}

export function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null {
  const pubSub = Reflect.get(sequelize, PubSubKey);
  return pubSub ? pubSub : null;
}

/*function gqlBulkCreateHook(
  pubSub: PubSubEngine,
  instances: Array<Model<any, any>>,
  options: BulkCreateOptions
) {}*/

// The Resolvers will convert to a Gql subscription
function gqlCreateHook(
  pubSub: RfiPubSubEngine,
  instance: Model<any, any>,
  deltas: ModelDelta[],
  options: CreateOptions
) {
  pubSub.publishPayload(NotificationOf.CREATED, instance, deltas);
}
function gqlUpdateHook(
  pubSub: RfiPubSubEngine,
  instance: Model<any, any>,
  deltas: ModelDelta[],
  options: UpdateOptions
) {
  pubSub.publishPayload(NotificationOf.UPDATED, instance, deltas);
}
