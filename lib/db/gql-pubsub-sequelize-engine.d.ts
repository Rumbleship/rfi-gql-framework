import { RfiPubSubEngine } from '../pubsub';
import { Model, Sequelize } from 'sequelize-typescript';
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: RfiPubSubEngine, sequelize: Sequelize): void;
export declare function publishCurrentState(instance: Model<any, any>): void;
export declare function pubSubFrom(sequelize: Sequelize): RfiPubSubEngine | null;
