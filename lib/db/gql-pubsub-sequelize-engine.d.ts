import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';
import { Model } from 'sequelize';
export declare function CreateTopic(topicName: string): Promise<void>;
export declare function SubscribeToThings(notificationClass: string, callback: any): Promise<void>;
/**
 *
 */
export declare function linkSequelizeToPubSubEngine(pubSub: PubSubEngine, sequelize: Sequelize): void;
export declare function publishCurrentState(instance: Model<any, any>): void;
export declare function pubSubFrom(sequelize: Sequelize): PubSubEngine | null;
