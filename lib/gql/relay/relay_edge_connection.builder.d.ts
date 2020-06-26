/**
 * Upgrades the GQLEdge to support typegraphql interface mechanism in release candidate 1.0.0rc2 and correctly allow for
 * mapping the implementatio of a base class for a relay object with the interface class used by the graphql type sytem
 */
import { Node, Edge, Connection } from './relay.interface';
import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
export declare function buildEdgeClass<T extends Node<T>, TI>(options: {
    RelayClass: ClassType<T>;
    SchemaClass?: ClassType<TI>;
    schemaType?: AttribType;
}): ClassType<Edge<T>>;
/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
export declare function buildConnectionClass<T extends Node<T>, TEdge extends Edge<T>, TI>(options: {
    RelayClass: ClassType<T>;
    EdgeClass: ClassType<TEdge>;
    SchemaCLass?: ClassType<TI>;
    schemaType?: AttribType;
}): ClassType<Connection<T>>;
