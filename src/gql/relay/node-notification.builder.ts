import { ObjectType, Field } from 'type-graphql';
import { ClassType } from './../../helpers/';
import { NotificationOf } from './notification-of.enum';
import { Node } from './relay.interface';
import { ModelDelta, ModelDeltaClass, NodeNotification } from './node-notification';

@ObjectType('Delta')
export class GqlModelDelta extends ModelDeltaClass {
  @Field()
  key!: string;
  @Field()
  previousValue!: string;
  @Field()
  newValue!: string;
}

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

    @Field(type => [GqlModelDelta])
    watch_list_deltas!: ModelDeltaClass[];

    constructor(
      notificationOf: NotificationOf,
      idempotency_key: string,
      node: T,
      watch_list_deltas?: ModelDelta[]
    ) {
      super(notificationOf, idempotency_key, node, watch_list_deltas);
    }
  }
  return GqlNodeNotificationClass;
}
