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

export interface ModelDelta {
  key: string;
  previousValue: any;
  newValue: any;
}

@ObjectType()
export class GqlModelDelta {
  @Field()
  key!: string;
  @Field({ nullable: true })
  previousValue!: string;
  @Field()
  newValue!: string;
  constructor(delta: ModelDelta) {
    this.key = delta.key;
    this.previousValue = JSON.stringify(delta.previousValue);
    this.newValue = JSON.stringify(delta.newValue);
  }
}

export abstract class NodeNotification<T extends Node<T>> {
  sequence: number;
  notificationOf: NotificationOf;
  node: T;
  deltas: GqlModelDelta[];
  constructor(notificationOf: NotificationOf, node: T, deltas: ModelDelta[]) {
    this.notificationOf = notificationOf;
    this.node = node;
    this.sequence = Date.now();
    this.deltas = deltas.map(delta => {
      return new GqlModelDelta(delta);
    });
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
    @Field(type => [GqlModelDelta])
    deltas!: GqlModelDelta[];
    constructor(notificationOf: NotificationOf, node: T, deltas: ModelDelta[]) {
      super(notificationOf, node, deltas);
    }
  }
  return GqlNodeNotificationClass;
}

// and the type used to transmit database changes
export class DbModelChangeNotification {
  constructor(
    public notificationOf: NotificationOf,
    public model: Model<any, any>,
    public deltas: ModelDelta[]
  ) {}
}
