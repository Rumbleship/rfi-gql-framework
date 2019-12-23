import { RfiPubSubEngine } from '../pubsub';
import { Sequelize } from 'sequelize-typescript';
import { Model } from 'sequelize';
export declare function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null;
/**
import {
  attachPubSubEngineToSequelize,
//  pub
} from '../src/pubsub/helper';
**/
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: RfiPubSubEngine, sequelize: Sequelize): void;
export declare function publishCurrentState(instance: Model<any, any>): void;
