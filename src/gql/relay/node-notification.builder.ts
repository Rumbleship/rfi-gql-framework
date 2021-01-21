import { Scopes } from '@rumbleship/acl';
import { ObjectType, Field, Authorized } from 'type-graphql';
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

    /**
     * We define this as a field on the node notification so the core GraphQL/TypeGraphQL `subscribe()`
     * function takes care of adding it to any responses.
     *
     * @see create-node-notification.ts for how this value is propagated from the trace marshalled
     * onto a ModelChange
     *
     * @see queued-subscription.ts.start() for where this value is extracted and used to bind responses
     * to the trace.
     *
     * @note that this field is *expressly deleted* from any ExecutionResult passed into a resolver.
     * It would be nice to not have it as a fieldResolver, but it's too difficult to inject deeply
     * into the GraphQL/TypeGraphQL subscription executors to get access to raw pubsub message/attributes.
     */
    @Authorized(Scopes.SYSADMIN)
    @Field({
      description:
        'Requesting this on a QSO will allow the trace to propagate from model-change publisher through QSO infra. Your responder will be executed within the trace context of the initial publish. This value is _explicitly deleted_ from the data that is passed into your subscription resolver.'
    })
    marshalledTrace?: string;

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
