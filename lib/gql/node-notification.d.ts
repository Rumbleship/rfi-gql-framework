import { Node } from './node.interface';
import { Model } from 'sequelize';
import { ClassType } from '../helpers/index';
export declare enum NotificationOf {
    LAST_KNOWN_STATE = "LAST_KNOWN_STATE",
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DESTROYED = "DESTORYED",
    BULK_CHANGE = "BULK_CHANGE"
}
export declare const NODE_CHANGE_NOTIFICATION = "NODE_CHANGE_NOTIFICATION";
export declare abstract class NodeNotification<T extends Node<T>> {
    sequence: number;
    notificationOf: NotificationOf;
    node: T;
    constructor(notificationOf: NotificationOf, node: T);
}
export declare function GqlNodeNotification<T extends Node<T>>(clsNotification: ClassType<T>): ClassType<NodeNotification<T>>;
export declare class DbModelChangeNotification {
    notificationOf: NotificationOf;
    model: Model<any, any>;
    constructor(notificationOf: NotificationOf, model: Model<any, any>);
}
