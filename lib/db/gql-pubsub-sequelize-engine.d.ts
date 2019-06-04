import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: PubSubEngine, sequelize: Sequelize): void;
export declare function pubSubFrom(sequelize: Sequelize): PubSubEngine | null;
