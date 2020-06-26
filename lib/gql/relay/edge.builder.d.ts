import { ClassType } from '../../helpers';
import { AttribType } from './attrib.enum';
import { Node, Edge } from './relay.interface';
/**
 * @deprecated in favour of @see buildEdgeClass
 * @param TEdge
 * @param attribType
 */
export declare function GQLEdge<T extends Node<T>>(TEdge: ClassType<T>, attribType?: AttribType): ClassType<Edge<T>>;
