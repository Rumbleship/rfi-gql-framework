import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { Node } from './node.interface';
import { Model } from 'sequelize';

export enum NotificationOf {
  LAST_KNOWN_STATE = 'LAST_KNOWN_STATE',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DESTROYED = 'DESTORYED',
  BULK_CHANGE = 'BULK_CHANGE'
}
registerEnumType(NotificationOf, {
  name: 'NotificationOf',
  description: `For PubSub: The type of Notification. Note that BULK_CHANGE is sent when multiple 
  updates creates or destroys have been detected and the server can't be sure what they were EG if a
  complex bulk create or update was executed by the server,and the client should generally refresh all models 
  they are interested in.
  `
});

@ObjectType()
export class GqlNodeNotification<T extends Node<T>> {
  @Field()
  sequence: number = Date.now();
  @Field(type => NotificationOf)
  notificationOf: NotificationOf;
  @Field(type => [Node], { nullable: true })
  node: T;
  constructor(notificationOf: NotificationOf, node: T) {
    this.notificationOf = notificationOf;
    this.node = node;
  }
}

// and the type used to transmit database changes
export class DbModelChangeNotification {
  constructor(public notificationOf: NotificationOf, public model: Model<any, any>) {}
}
