import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';

export interface ModelDelta {
  key: string;
  previousValue: any;
  newValue: any;
}

export abstract class NodeNotification<T extends Node<T>> {
  sequence: number;
  notificationOf: NotificationOf;
  node: T;
  constructor(notificationOf: NotificationOf, node: T) {
    this.notificationOf = notificationOf;
    this.node = node;
    this.sequence = Date.now();
  }
}
