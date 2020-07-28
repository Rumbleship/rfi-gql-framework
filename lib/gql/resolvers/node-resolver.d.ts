import { PubSubEngine } from 'type-graphql';
import { RelayResolver } from './relay-resolver.interface';
import { Node, NodeNotification, NotificationOf, NodeService } from '../relay';
import { RawPayload } from './create-node-notification';
declare class ClassGqlNodeNotification extends NodeNotification<any> {
    idempotency_key: string;
    notificationOf: NotificationOf;
    node: Node<any>;
    constructor(notificationOf: NotificationOf, idempotency_key: string, node: Node<any>);
}
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: any): Promise<Node<any> | null>;
    publishLastKnownState(oidString: string, pubSub: PubSubEngine, ctx: any): boolean;
    onChange(rawPayload: RawPayload): Promise<ClassGqlNodeNotification>;
    unWrapOid(oidString: string, ctx: any): Promise<string>;
    makeOid(scope: string, id: string, ctx: any): Promise<string>;
}
export {};
