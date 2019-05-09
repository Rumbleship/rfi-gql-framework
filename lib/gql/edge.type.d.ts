import { Node } from './node.interface';
import { ClassType } from '../helpers/classtype';
export declare abstract class Edge<T extends Node<T>> {
    node: T;
    cursor: string;
}
export declare function GQLEdge<T extends Node<T>>(TEdge: ClassType<T>): any;
