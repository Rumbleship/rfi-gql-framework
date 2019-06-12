import { Service, Inject } from 'typedi';
import {
  Resolver,
  Query,
  ID,
  Arg,
  Ctx,
  Subscription,
  Field,
  Int,
  ObjectType,
  Root
} from 'type-graphql';
import { Node, RelayResolver, Oid } from './index';
import { NodeService } from './relay.service';
import {
  NodeNotification,
  NotificationOf,
  NODE_CHANGE_NOTIFICATION,
  DbModelChangeNotification
} from './node-notification';

// we make a specific concreate type here for the concrete general Node notification
@ObjectType()
class ClassGqlNodeNotification extends NodeNotification<any> {
  @Field(type => Int)
  sequence!: number;
  @Field(type => NotificationOf)
  notificationOf!: NotificationOf;
  @Field(type => Node, { nullable: true })
  node!: Node<any>;
  constructor(notificationOf: NotificationOf, node: Node<any>) {
    super(notificationOf, node);
  }
}

@Service()
@Resolver()
export class NodeResolver implements RelayResolver {
  constructor(
    // constructor injection of service
    @Inject('nodeServices') private readonly nodeServices: Array<NodeService<any>>
  ) {}
  // to conform with the Relay Connection spec
  // this is the generic resolver givin an ID, it can always resolcve to one of the domain objects..
  @Query(returns => Node, { nullable: true })
  async node(@Arg('id', type => ID) oidString: string, @Ctx() ctx: any): Promise<Node<any> | null> {
    const oid = new Oid(oidString);
    const { scope } = oid.unwrap();
    if (scope in this.nodeServices) {
      return Reflect.get(this.nodeServices, scope).getOne(oid);
    }
    throw Error('Invalid OID. Scope:' + scope);
  }
  @Subscription(type => ClassGqlNodeNotification, {
    name: `onNodeChange`,
    topics: `${NODE_CHANGE_NOTIFICATION}`,
    nullable: true
  })
  async onChange(@Root() payload: DbModelChangeNotification): Promise<ClassGqlNodeNotification> {
    // convert to GQL Model
    const modelId: number | string = payload.model.get('id') as number | string;
    // ASSUME that the db model is suffixed with Model
    const gqlModelName = payload.model.constructor.name.slice(0, 'Model'.length);
    const oid = Oid.create(gqlModelName, modelId);
    if (gqlModelName in this.nodeServices) {
      const node = Reflect.get(this.nodeServices, gqlModelName).getOne(oid);
      const gqlNodeNotification = new ClassGqlNodeNotification(payload.notificationOf, node);
      return gqlNodeNotification;
    } else {
      throw Error('Invalid OID. Scope:' + gqlModelName);
    }
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
    const oid = Oid.create(scope, `${id}`);
    return oid.toString();
  }
}
