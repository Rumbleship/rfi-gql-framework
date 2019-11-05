import { PubSubEngine } from 'type-graphql';
import { Node, RelayResolver } from './index';
import { NodeService } from './relay.service';
import { NodeNotification, NotificationOf, DbModelChangeNotification, GqlModelDelta, ModelDelta } from './node-notification';
declare class ClassGqlNodeNotification extends NodeNotification<any> {
    sequence: number;
    notificationOf: NotificationOf;
    node: Node<any>;
    deltas: GqlModelDelta[];
    constructor(notificationOf: NotificationOf, node: Node<any>, deltas: ModelDelta[]);
}
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: any): Promise<Node<any> | null>;
    publishLastKnownState(oidString: string, pubSub: PubSubEngine, ctx: any): boolean;
    onChange(payload: DbModelChangeNotification): Promise<ClassGqlNodeNotification>;
    unWrapOid(oidString: string, ctx: any): Promise<string>;
    makeOid(scope: string, id: string, ctx: any): Promise<string>;
}
export {};
