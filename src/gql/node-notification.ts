import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { Node } from './node.interface';
import { Model } from 'sequelize';
import { ClassType } from '../helpers/index';

export enum NotificationOf {
  LAST_KNOWN_STATE = 'LAST_KNOWN_STATE',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED'
}

registerEnumType(NotificationOf, {
  name: 'NotificationOf',
  description: `For PubSub: The type of Notification. Note that BULK_CHANGE is sent when multiple 
  updates creates or destroys have been detected and the server can't be sure what they were EG if a
  complex bulk create or update was executed by the server,and the client should generally refresh all models 
  they are interested in.
  `
});

export const NODE_CHANGE_NOTIFICATION = 'NODE_CHANGE_NOTIFICATION';

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

export function GqlNodeNotification<T extends Node<T>>(
  clsNotification: ClassType<T>
): ClassType<NodeNotification<T>> {
  @ObjectType({ isAbstract: true })
  class GqlNodeNotificationClass extends NodeNotification<T> {
    @Field()
    sequence!: number;
    @Field(type => NotificationOf)
    notificationOf!: NotificationOf;
    @Field(type => clsNotification, { nullable: true })
    node!: T;
    constructor(notificationOf: NotificationOf, node: T) {
      super(notificationOf, node);
    }
  }
  return GqlNodeNotificationClass;
}

// and the type used to transmit database changes
export class DbModelChangeNotification {
  constructor(
    public notificationOf: NotificationOf,
    public model: Model<any, any>,
    public changedValues?: object
  ) {}
}
