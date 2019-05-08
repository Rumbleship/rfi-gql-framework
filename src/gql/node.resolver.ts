import { Service, Inject } from 'typedi';
import { Resolver, Query, ID, Arg, Ctx } from 'type-graphql';
import { Node, RelayResolver, Oid } from '../../../banking/src/gql/model/index';
import { NodeService } from './relay-api/relay.service';

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
