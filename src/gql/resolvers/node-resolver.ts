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
  Args,
  Authorized
} from 'type-graphql';
import { Oid } from '@rumbleship/oid';
import { AddToTrace } from '@rumbleship/o11y';

import { RelayResolver } from './relay-resolver.interface';
import {
  Node,
  NodeNotification,
  NotificationOf,
  NodeService,
  withTimeStampsFilter
} from '../relay';
import { RawPayload, createNodeNotification } from './create-node-notification';
import { RumbleshipSubscription } from './rumbleship-subscription';
import { withSubscriptionFilter } from '../relay/mixins/with-subscription-filter.mixin';

import { filterBySubscriptionFilter } from './filter-by-subscription-filter';
import { RumbleshipContext } from './../../app/rumbleship-context';
import { Scopes } from '@rumbleship/acl';
import { triggerName } from '../../app/server/topic-name';

const version_scoped_topic = triggerName();
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
  @Field(type => String)
  @Authorized(Scopes.SYSADMIN)
  marshalledTrace?: string;
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
  @Query(returns => Node, { nullable: true })
  @AddToTrace()
  async node(
    @Arg('id', type => ID) oidString: string,
    @Ctx() ctx: RumbleshipContext
  ): Promise<Node<any> | null> {
    const oid = new Oid(oidString);
    const { scope } = oid.unwrap();
    if (scope in this.nodeServices) {
      return Reflect.get(this.nodeServices, scope).getOne(oid);
    }
    throw Error('Invalid OID. Scope:' + scope);
  }

  @Mutation(returns => Boolean)
  @AddToTrace()
  async publishLastKnownState(
    @Arg('id', type => ID) oidString: string,
    @PubSub() pubSub: PubSubEngine,
    @Ctx() ctx: RumbleshipContext
  ): Promise<boolean> {
    const oid = new Oid(oidString);
    const { scope } = oid.unwrap();
    if (scope in this.nodeServices) {
      Reflect.get(this.nodeServices, scope).publishLastKnownState(oid);
    }
    return true;
  }

  @RumbleshipSubscription(type => ClassGqlNodeNotification, {
    name: `onNodeChange`,
    topics: version_scoped_topic,
    filter: filterBySubscriptionFilter,
    nullable: true
  })
  @AddToTrace()
  async onChange(
    @Root() rawPayload: RawPayload,
    @Args(type => NodeSubscriptionFilter) args: NodeSubscriptionFilter,
    @Ctx() ctx: RumbleshipContext
  ): Promise<ClassGqlNodeNotification> {
    const recieved = JSON.parse(rawPayload.data.toString());
    const strOid = recieved?.oid;
    const oid: Oid = new Oid(strOid);
    const { scope } = oid.unwrap();

    if (scope in this.nodeServices) {
      const service = Reflect.get(this.nodeServices, scope);
      return createNodeNotification(
        rawPayload,
        service,
        ClassGqlNodeNotification,
        args?.watch_list
      );
    }
    throw Error('Invalid OID. Scope: ' + scope);
  }
  // for developers and system support,
  @Query(returns => String)
  @AddToTrace()
  async unWrapOid(
    @Arg('id', type => ID) oidString: string,
    @Ctx() ctx: RumbleshipContext
  ): Promise<string> {
    const oid = new Oid(oidString);
    const { scope, id } = oid.unwrap();
    return scope + ':' + id;
  }

  @Query(returns => String)
  @AddToTrace()
  async makeOid(
    @Arg('scope', type => String) scope: string,
    @Arg('id', type => String) id: string,
    @Ctx() ctx: RumbleshipContext
  ): Promise<string> {
    const oid = Oid.Create(scope, `${id}`);
    return oid.toString();
  }
}
