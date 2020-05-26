import { ID, InterfaceType, Field } from 'type-graphql';
import { Oid } from '@rumbleship/oid';
import { NodeService } from './relay.service';

@InterfaceType({ isAbstract: true })
export abstract class Node<T> {
  @Field(type => ID)
  id!: Oid;

  _service!: NodeService<Node<T>>;
}
