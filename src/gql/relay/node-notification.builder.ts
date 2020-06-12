import { ObjectType, Field } from 'type-graphql';
import { ClassType } from './../../helpers/';
import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';
import { NodeNotification } from './node-notification';

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
