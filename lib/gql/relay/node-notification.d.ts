import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';
export interface ModelDelta {
    key: string;
    previousValue: any;
    newValue: any;
}
export declare class ModelDeltaClass {
    constructor(delta: ModelDelta);
    key: string;
    previousValue: string;
    newValue: string;
}
export declare abstract class NodeNotification<T extends Node<T>> {
    idempotency_key: string;
    notificationOf: NotificationOf;
    watch_list_deltas: ModelDeltaClass[];
    node: T;
    marshalledTrace?: string;
    constructor(notificationOf: NotificationOf, idempotency_key: string, node: T, watch_list_deltas?: ModelDelta[]);
    setTrace(val: string | undefined): void;
}
