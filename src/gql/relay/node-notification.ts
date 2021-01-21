import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';

export interface ModelDelta {
  key: string;
  previousValue: any;
  newValue: any;
}

export class ModelDeltaClass {
  constructor(delta: ModelDelta) {
    this.key = delta.key;
    this.newValue = `${delta.newValue}`;
    this.previousValue = `${delta.previousValue}`;
  }
  key: string;
  previousValue: string;
  newValue: string;
}

export abstract class NodeNotification<T extends Node<T>> {
  idempotency_key: string;
  notificationOf: NotificationOf;
  watch_list_deltas: ModelDeltaClass[] = [];
  node: T;
  constructor(
    notificationOf: NotificationOf,
    idempotency_key: string,
    node: T,
    watch_list_deltas?: ModelDelta[],
    public marshalledTrace?: string
  ) {
    if (!idempotency_key) {
      throw Error(`Must have a idempotency_key set on change of ${node.constructor.name}`);
    }
    this.notificationOf = notificationOf;
    this.node = node;
    this.idempotency_key = idempotency_key;
    if (watch_list_deltas) {
      this.watch_list_deltas = watch_list_deltas.map(delta => new ModelDeltaClass(delta));
    }
  }
}
