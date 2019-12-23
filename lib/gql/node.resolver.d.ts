import { PubSubEngine } from 'type-graphql';
import { Node, RelayResolver } from './index';
import { NodeService } from './relay.service';
export declare class NodeResolver implements RelayResolver {
    private readonly nodeServices;
    constructor(nodeServices: Array<NodeService<any>>);
    node(oidString: string, ctx: any): Promise<Node<any> | null>;
    publishLastKnownState(oidString: string, pubSub: PubSubEngine, ctx: any): boolean;
    unWrapOid(oidString: string, ctx: any): Promise<string>;
    makeOid(scope: string, id: string, ctx: any): Promise<string>;
}
