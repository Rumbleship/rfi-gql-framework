import { ClassType } from '../../helpers/classtype';
import { Field } from 'type-graphql';
import { PageInfo } from './page-info.type';
import { AttribType } from './attrib.enum';
import { GqlBaseAttribs } from './base-attribs.builder';
import { Node, Edge, Connection } from './relay.interface';

// see https://facebook.github.io/relay/graphql/connections.htm

// We have to derive a concrete class for Connections, as the typescript introspection
// isnt good enogth with generics ( ie the abstract edges cant be decorated successfully as a
// graphQL field)...but we can still pull up common beviours to this abstract
// class
/**
 * @deprecated in favour of @see buildConnetionClass
 * @param TClass
 * @param TEdgeClass
 * @param attribType
 */
export function GQLConnection<T extends Node<T>, TEdge extends Edge<T>>(
  TClass: ClassType<T>,
  TEdgeClass: ClassType<TEdge>,
  attribType: AttribType = AttribType.Obj
): ClassType<Connection<T>> {
  @GqlBaseAttribs(attribType)
  class GQLConnectionClass extends Connection<T> {
    @Field(type => PageInfo)
    pageInfo: PageInfo = new PageInfo();
    @Field(type => [TEdgeClass])
    edges!: TEdge[];

    addEdges(edges: TEdge[], hasNextPage: boolean, hasPreviousPage: boolean): void {
      super.addEdges(edges, hasNextPage, hasPreviousPage);
    }
  }
  return GQLConnectionClass;
}
