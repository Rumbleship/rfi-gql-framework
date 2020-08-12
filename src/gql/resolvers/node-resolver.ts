import { Service, Inject } from 'typedi';
import {
  Resolver,
  Query,
  ID,
  Arg,
  Ctx,
  Field,
  Int,
  ObjectType,
  Root,
  Mutation,
  PubSubEngine,
  PubSub,
  Args
} from 'type-graphql';
import { Oid } from '@rumbleship/oid';
import { AddToTrace } from '@rumbleship/o11y';

import { RelayResolver } from './relay-resolver.interface';
import {
  Node,
  NodeNotification,
  NotificationOf,
  NodeService,
  NODE_CHANGE_NOTIFICATION,
  withTimeStampsFilter
} from '../relay';
import { RawPayload, createNodeNotification } from './create-node-notification';
import { RumbleshipSubscription } from './rumbleship_subscription';
import { withSubscriptionFilter } from '../relay/mixins/with_subscription_filter.mixin';

import { filterBySubscriptionFilter } from './filter_by_subscription_filter';

class Empty {}
class NodeSubscriptionFilter extends withSubscriptionFilter(
  withTimeStampsFilter(Empty),
  'NodeSubscriptionWatchList'
) {}
// we make a specific concreate type here for the concrete general Node notification
@ObjectType()
class ClassGqlNodeNotification extends NodeNotification<any> {
  @Field(type => Int)
  idempotency_key!: string;
  @Field(type => NotificationOf)
  notificationOf!: NotificationOf;
  @Field(type => Node, { nullable: true })
  node!: Node<any>;
  constructor(notificationOf: NotificationOf, idempotency_key: string, node: Node<any>) {
    super(notificationOf, idempotency_key, node);
  }
}

@Service()
@Resolver()
export class NodeResolver implements RelayResolver {
  constructor(
    // constructor injection of service
    @Inject('nodeServices')
    private readonly nodeServices: Array<NodeService<any>>
  ) {}
  // to conform with the Relay Connection spec
  // this is the generic resolver givin an ID, it can always resolcve to one of the domain objects..
  @AddToTrace()
  @Query(returns => Node, { nullable: true })
  async node(@Arg('id', type => ID) oidString: string, @Ctx() ctx: any): Promise<Node<any> | null> {
    const oid = new Oid(oidString);
    const { scope } = oid.unwrap();
    if (scope in this.nodeServices) {
      return Reflect.get(this.nodeServices, scope).getOne(oid);
    }
    throw Error('Invalid OID. Scope:' + scope);
  }

  @AddToTrace()
  @Mutation(returns => Boolean)
  publishLastKnownState(
    @Arg('id', type => ID) oidString: string,
    @PubSub() pubSub: PubSubEngine,
    @Ctx() ctx: any
  ): boolean {
    const oid = new Oid(oidString);
    const { scope } = oid.unwrap();
    if (scope in this.nodeServices) {
      Reflect.get(this.nodeServices, scope).publishLastKnownState(oid);
    }
    return true;
  }

  @RumbleshipSubscription(type => ClassGqlNodeNotification, {
    name: `onNodeChange`,
    topics: `${NODE_CHANGE_NOTIFICATION}`,
    filter: filterBySubscriptionFilter,
    nullable: true
  })
  async onChange(
    @Root() rawPayload: RawPayload,
    @Args(type => NodeSubscriptionFilter) args: NodeSubscriptionFilter
  ): Promise<ClassGqlNodeNotification> {
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = recieved?.oid;
    const oid: Oid = new Oid(strOid);
    const { scope } = oid.unwrap();

    if (scope in this.nodeServices) {
      const service = Reflect.get(this.nodeServices, scope);
      return createNodeNotification(rawPayload, service, ClassGqlNodeNotification);
    }
    throw Error('Invalid OID. Scope: ' + scope);
  }
  // for developers and system support,
  @Query(returns => String)
  async unWrapOid(@Arg('id', type => ID) oidString: string, @Ctx() ctx: any): Promise<string> {
    const oid = new Oid(oidString);
    const { scope, id } = oid.unwrap();
    return scope + ':' + id;
  }

  @Query(returns => String)
  async makeOid(
    @Arg('scope', type => String) scope: string,
    @Arg('id', type => String) id: string,
    @Ctx() ctx: any
  ): Promise<string> {
    const oid = Oid.Create(scope, `${id}`);
    return oid.toString();
  }
}
