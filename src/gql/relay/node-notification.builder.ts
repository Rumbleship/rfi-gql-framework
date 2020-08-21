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
    idempotency_key!: string;
    @Field(type => NotificationOf)
    notificationOf!: NotificationOf;
    @Field(type => clsNotification, { nullable: true })
    node!: T;

    constructor(notificationOf: NotificationOf, idempotency_key: string, node: T) {
      super(notificationOf, idempotency_key, node);
    }
  }
  return GqlNodeNotificationClass;
}
