import { Model, Sequelize } from 'sequelize-typescript';
import { RfiPubSubEngine } from './rfi-pub-sub-engine';
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: RfiPubSubEngine, sequelize: Sequelize): void;
export declare function publishCurrentState(instance: Model<any, any>): void;
export declare function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null;
