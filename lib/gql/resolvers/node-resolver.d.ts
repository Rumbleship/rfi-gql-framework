import { PubSubEngine } from 'type-graphql';
import { RelayResolver } from './relay-resolver.interface';
import { Node, NodeNotification, NotificationOf, NodeService } from '../relay';
import { RawPayload } from './create-node-notification';
import { RumbleshipContext } from './../../app/rumbleship-context';
declare class Empty {
}
declare const NodeSubscriptionFilter_base: {
    new (...args: any[]): {
        watch_list?: string[] | undefined;
        id?: string | undefined;
    };
} & {
    new (...args: any[]): {
        created_at?: Date | undefined;
        created_between?: import("..").DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: import("..").DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: import("..").DateRange | undefined;
    };
} & typeof Empty;
declare class NodeSubscriptionFilter extends NodeSubscriptionFilter_base {
}
declare class ClassGqlNodeNotification extends NodeNotification<any> {
    idempotency_key: string;
    notificationOf: NotificationOf;
    node: Node<any>;
    constructor(notificationOf: NotificationOf, idempotency_key: string, node: Node<any>);
}
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: RumbleshipContext): Promise<Node<any> | null>;
    publishLastKnownState(oidString: string, pubSub: PubSubEngine, ctx: RumbleshipContext): Promise<boolean>;
    onChange(rawPayload: RawPayload, args: NodeSubscriptionFilter): Promise<ClassGqlNodeNotification>;
    unWrapOid(oidString: string, ctx: RumbleshipContext): Promise<string>;
    makeOid(scope: string, id: string, ctx: RumbleshipContext): Promise<string>;
}
export {};
