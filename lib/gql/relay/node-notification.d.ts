import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';
export interface ModelDelta {
    key: string;
    previousValue: any;
    newValue: any;
}
export declare abstract class NodeNotification<T extends Node<T>> {
    change_uuid: string;
    notificationOf: NotificationOf;
    node: T;
    constructor(notificationOf: NotificationOf, change_uuid: string, node: T);
}
