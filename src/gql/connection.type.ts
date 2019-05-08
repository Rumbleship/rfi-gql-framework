import { PageInfo } from './page-info.type';
import { Edge } from './edge.type';
import { Node } from './node.interface';
import { Field, ObjectType } from 'type-graphql';
import { ClassType } from '../helpers/classtype';

// see https://facebook.github.io/relay/graphql/connections.htm

// We have to derive a concrete class for Connections, as the typescript introspection
// isnt good enogth with generics ( ie the abstract edges cant be decorated successfully as a
// graphQL field)...but we can still pull up common beviours to this abstract
// class
export class Connection<T extends Node<T>> {
  pageInfo: PageInfo = new PageInfo();
  edges!: Array<Edge<T>>;
  addEdges(edges: Array<Edge<T>>, hasNextPage: boolean, hasPreviousPage: boolean): void {
    if (edges.length === 0) {
      this.pageInfo.setInfo(hasNextPage, hasPreviousPage);
    } else {
      this.pageInfo.setInfo(
        hasNextPage,
        hasPreviousPage,
        edges[0].cursor,
        edges[edges.length - 1].cursor
      );
    }
    this.edges = edges;
    return;
  }
}
// tslint: disable-next-line
export function GQLConnection<T extends Node<T>, TEdge extends Edge<T>>(
  TClass: ClassType<T>,
  TEdgeClass: ClassType<TEdge>
): ClassType<Connection<T>> {
  @ObjectType({ isAbstract: true })
  class GQLConnectionClass extends Connection<T> {
    @Field(type => PageInfo)
    pageInfo: PageInfo = new PageInfo();
    @Field(type => TEdgeClass)
    edges!: TEdge[];

    addEdges(edges: TEdge[], hasNextPage: boolean, hasPreviousPage: boolean): void {
      super.addEdges(edges, hasNextPage, hasPreviousPage);
    }
  }
  return GQLConnectionClass;
}
