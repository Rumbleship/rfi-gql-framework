import { Node } from './node.interface';
import { Model } from 'sequelize';
export declare enum NotificationOf {
    LAST_KNOWN_STATE = "LAST_KNOWN_STATE",
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DESTROYED = "DESTORYED",
    BULK_CHANGE = "BULK_CHANGE"
}
export declare class GqlNodeNotification<T extends Node<T>> {
    sequence: number;
    notificationOf: NotificationOf;
    node: T;
    constructor(notificationOf: NotificationOf, node: T);
}
export declare class DbModelChangeNotification {
    notificationOf: NotificationOf;
    model: Model<any, any>;
    constructor(notificationOf: NotificationOf, model: Model<any, any>);
}
