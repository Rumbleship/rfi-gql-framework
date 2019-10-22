import { ID, InterfaceType, Field } from 'type-graphql';
import { Oid } from '@rumbleship/types';
import { NodeService } from './relay.service';

@InterfaceType()
export abstract class Node<T> {
  @Field(type => ID)
  id!: Oid;

  _service!: NodeService<T>;
}
