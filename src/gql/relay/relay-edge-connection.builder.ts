/**
 * Upgrades the GQLEdge to support typegraphql interface mechanism in release candidate 1.0.0rc2 and correctly allow for
 * mapping the implementatio of a base class for a relay object with the interface class used by the graphql type sytem
 */

import { Field } from 'type-graphql';
import { Node, Edge, Connection } from './relay.interface';
import { ClassType } from '../../helpers/classtype';
import { AttribType } from './attrib.enum';
import { GqlBaseAttribs } from './base-attribs.builder';
import { PageInfo } from './page-info.type';

/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
export function buildEdgeClass<T extends Node<T>, TI>(options: {
  RelayClass: ClassType<T>;
  SchemaClass?: ClassType<TI>;
  schemaType?: AttribType;
}): ClassType<Edge<T>> {
  const { RelayClass, SchemaClass, schemaType } = options;
  const GqlType = SchemaClass ?? RelayClass;

  @GqlBaseAttribs(schemaType ?? AttribType.Obj)
  class RelayEdgeClass extends Edge<T> {
    // node must be overridden in a concrete class and decorated with it's actual concrete (not generic template)
    // type in order or type-graphql to correctly type it at runtime
    @Field(type => GqlType)
    node!: T;
    @Field()
    cursor!: string;
  }
  return RelayEdgeClass;
}

/**
 * @note `SchemaClass` can be passed in addition to `RelayClass` because polymorphic single-table-inheritence
 * typesafety requires it.
 */
export function buildConnectionClass<T extends Node<T>, TEdge extends Edge<T>, TI>(options: {
  RelayClass: ClassType<T>;
  EdgeClass: ClassType<TEdge>;
  SchemaClass?: ClassType<TI>;
  schemaType?: AttribType;
}): ClassType<Connection<T>> {
  const { EdgeClass, SchemaClass, schemaType } = options;
  const GqlType = SchemaClass ?? EdgeClass;
  @GqlBaseAttribs(schemaType ?? AttribType.Obj)
  class RelayConnectionClass extends Connection<T> {
    @Field(type => PageInfo)
    pageInfo: PageInfo = new PageInfo();
    @Field(type => GqlType)
    edges!: TEdge[];

    addEdges(edges: TEdge[], hasNextPage: boolean, hasPreviousPage: boolean): void {
      super.addEdges(edges, hasNextPage, hasPreviousPage);
    }
  }
  return RelayConnectionClass;
}
