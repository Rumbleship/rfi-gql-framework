import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
export declare const NODE_CHANGE_NOTIFICATION = "NODE_CHANGE_NOTIFICATION";
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: PubSubEngine, sequelize: Sequelize): void;
