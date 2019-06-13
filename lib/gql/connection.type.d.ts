import { PageInfo } from './page-info.type';
import { Edge } from './edge.type';
import { Node } from './node.interface';
import { ClassType } from '../helpers/classtype';
import { AttribType } from './attrib.enum';
export declare class Connection<T extends Node<T>> {
    pageInfo: PageInfo;
    edges: Array<Edge<T>>;
    addEdges(edges: Array<Edge<T>>, hasNextPage: boolean, hasPreviousPage: boolean): void;
}
export declare function GQLConnection<T extends Node<T>, TEdge extends Edge<T>>(TClass: ClassType<T>, TEdgeClass: ClassType<TEdge>, attribType?: AttribType): ClassType<Connection<T>>;
