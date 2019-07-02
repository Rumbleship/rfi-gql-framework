import { PubSubEngine } from 'type-graphql';
import { Node, RelayResolver, Oid } from './index';
import { NodeService } from './relay.service';
import { NodeNotification, NotificationOf, DbModelChangeNotification } from './node-notification';
declare class ClassGqlNodeNotification extends NodeNotification<any> {
    sequence: number;
    notificationOf: NotificationOf;
    node: Node<any>;
    constructor(notificationOf: NotificationOf, node: Node<any>);
}
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: any): Promise<Node<any> | null>;
    publishLastKnownState(oid: Oid, pubSub: PubSubEngine, ctx: any): boolean;
    onChange(payload: DbModelChangeNotification): Promise<ClassGqlNodeNotification>;
    unWrapOid(oidString: string, ctx: any): Promise<string>;
    makeOid(scope: string, id: string, ctx: any): Promise<string>;
}
export {};
