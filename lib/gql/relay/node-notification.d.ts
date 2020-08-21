import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';
export interface ModelDelta {
    key: string;
    previousValue: any;
    newValue: any;
}
export declare abstract class NodeNotification<T extends Node<T>> {
    idempotency_key: string;
    notificationOf: NotificationOf;
    node: T;
    constructor(notificationOf: NotificationOf, idempotency_key: string, node: T);
}
