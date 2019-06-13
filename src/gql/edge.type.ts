import { Node } from './node.interface';
import { Field } from 'type-graphql';
import { ClassType } from '../helpers/classtype';
import { AttribType } from './attrib.enum';
import { GqlBaseAttribs } from './gql_helpers';

export abstract class Edge<T extends Node<T>> {
  // node must be overridden in a concrete class and decorated with it's actual concrete (not generic template)
  // type in order or type-graphQL to correctly type it at runtime
  node!: T;
  cursor!: string;
}

export function GQLEdge<T extends Node<T>>(
  TEdge: ClassType<T>,
  attribType: AttribType = AttribType.Obj
): ClassType<Edge<T>> {
  @GqlBaseAttribs(attribType)
  class GQLEdgeClass extends Edge<T> {
    // node must be overridden in a concrete class and decorated with it's actual concrete (not generic template)
    // type in order or type-graphQL to correctly type it at runtime
    @Field(type => TEdge)
    node!: T;
    @Field()
    cursor!: string;
  }
  return GQLEdgeClass;
}
