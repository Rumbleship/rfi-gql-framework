import { Model } from 'sequelize-typescript';
import { ModelDelta, NotificationOf } from './../../gql';
import { RfiPubSubEngine } from '../../app/server/rfi-pub-sub-engine.interface';
export interface Payload {
    publisher_version: string;
    oid: string;
    id: string;
    action: string;
    deltas: ModelDelta[];
}
export declare function publishModelChange(pubSub: RfiPubSubEngine, notification: NotificationOf, payload: Model, deltas: ModelDelta[]): Promise<void>;
