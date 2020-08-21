import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';

export interface ModelDelta {
  key: string;
  previousValue: any;
  newValue: any;
}

export abstract class NodeNotification<T extends Node<T>> {
  idempotency_key: string;
  notificationOf: NotificationOf;
  node: T;
  constructor(notificationOf: NotificationOf, idempotency_key: string, node: T) {
    if (!idempotency_key) {
      throw Error(`Must have a idempotency_key set on change of ${node.constructor.name}`);
    }
    this.notificationOf = notificationOf;
    this.node = node;
    this.idempotency_key = idempotency_key;
  }
}
