import { Node } from '../relay';

export interface RelayResolver {
  node(id: string, ctx: any): Promise<Node<any> | null>;
}
