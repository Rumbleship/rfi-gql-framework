/**
 * Upgrades the GQLEdge to support typegraphql interface mechanism in release candidate 1.0.0rc2 and correctly allow for
 * mapping the implementatio of a base class for a relay object with the interface class used by the graphql type sytem
 */
import { Node, Edge, Connection } from './relay.interface';
import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
/**
 * @see https://facebook.github.io/relay/graphql/connections.htm
 *
 * We have to derive a concrete class for Connections, as the typescript introspection
 * isnt good enougth with generics ( ie the abstract edges cant be decorated successfully as a
 * graphQL field)...but we can still pull up common beviours to this abstract
 * class
 */
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
    SchemaClass?: ClassType<TI>;
    schemaType?: AttribType;
}): ClassType<Connection<T>>;
