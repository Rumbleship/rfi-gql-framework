import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
import { Node, Edge, Connection } from './relay.interface';
/**
 * @deprecated in favour of @see buildConnetionClass
 * @param TClass
 * @param TEdgeClass
 * @param attribType
 */
export declare function GQLConnection<T extends Node<T>, TEdge extends Edge<T>>(TClass: ClassType<T>, TEdgeClass: ClassType<TEdge>, attribType?: AttribType): ClassType<Connection<T>>;
