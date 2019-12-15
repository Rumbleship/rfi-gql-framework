import { PubSubEngine } from 'type-graphql';
import { Node, RelayResolver } from './index';
import { NodeService } from './relay.service';
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: any): Promise<Node<any> | null>;
    publishLastKnownState(oidString: string, pubSub: PubSubEngine, ctx: any): boolean;
    /**
    @Subscription(type => ClassGqlNodeNotification, {
      name: `onNodeChange`,
      topics: `${NODE_CHANGE_NOTIFICATION}`,
      nullable: true
    })
    async onChange(@Root() payload: DbModelChangeNotification): Promise<ClassGqlNodeNotification> {
      // convert to GQL Model
      const modelId: number | string = payload.model.get('id') as number | string;
      // ASSUME that the db model is suffixed with Model
      const gqlModelName = payload.model.constructor.name.slice(
        0,
        payload.model.constructor.name.length - 'Model'.length
      );
      const oid = Oid.Create(gqlModelName, modelId);
      if (gqlModelName in this.nodeServices) {
        const node = Reflect.get(this.nodeServices, gqlModelName).getOne(oid);
        const gqlNodeNotification = new ClassGqlNodeNotification(payload.notificationOf, node);
        return gqlNodeNotification;
      } else {
        throw Error('Invalid OID. Scope:' + gqlModelName);
      }
    }
    **/
    unWrapOid(oidString: string, ctx: any): Promise<string>;
    makeOid(scope: string, id: string, ctx: any): Promise<string>;
}
