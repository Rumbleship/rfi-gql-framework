import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
import { Node, Edge, Connection } from './relay.interface';
export declare function GQLConnection<T extends Node<T>, TEdge extends Edge<T>>(TClass: ClassType<T>, TEdgeClass: ClassType<TEdge>, attribType?: AttribType): ClassType<Connection<T>>;
