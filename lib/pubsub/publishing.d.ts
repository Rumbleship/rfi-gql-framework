import { Model } from 'sequelize-typescript';
import { RfiPubSubEngine } from './index';
import { NotificationOf, ModelDelta } from '../gql/node-notification';
export interface Payload {
    oid: string;
    id: string;
    action: string;
    deltas: ModelDelta[];
}
export declare function publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: ModelDelta[]): Promise<void>;
