import { Model } from 'sequelize';
import { RfiPubSubEngine } from './index';
import { NotificationOf, ModelDelta } from '../gql/node-notification';
export declare function publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: ModelDelta[]): Promise<void>;
