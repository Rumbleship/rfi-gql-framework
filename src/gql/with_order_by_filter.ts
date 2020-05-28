import { ClassType } from '../helpers';
import { ArgsType, Field } from 'type-graphql';
import { RelayOrderByGQL, RelayOrderBy } from './relay_order_by.type';

export function withOrderByFilter<TBase extends ClassType<any>>(Base: TBase) {
  @ArgsType()
  class OrderByFilter extends Base {
    @Field(type => RelayOrderByGQL, { nullable: true })
    order_by?: RelayOrderBy<any>; // max number to return
  }
  return OrderByFilter;
}
