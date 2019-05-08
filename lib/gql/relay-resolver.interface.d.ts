import { Node } from './node.interface';
export interface RelayResolver {
    node(id: string, ctx: any): Promise<Node<any> | null>;
}
