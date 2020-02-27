import { Model } from 'sequelize-typescript';
import { RfiPubSubEngine } from './index';
import { NotificationOf, ModelDelta } from '../gql/node-notification';
export interface Payload {
    publisher_version: string;
    oid: string;
    id: string;
    action: string;
    deltas: ModelDelta[];
}
export declare function publishPayload(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: ModelDelta[]): Promise<void>;
