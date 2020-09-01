import { ArgsType, Field } from 'type-graphql';
import { RelayOrderByGQL, RelayOrderBy } from '../../scalars/relay-order-by.scalar';
import { ClassType } from '../../../helpers';

export function withOrderByFilter<TFilterBase extends ClassType<Record<string, any>>>(
  Base: TFilterBase
) {
  @ArgsType()
  class OrderByFilter extends Base {
    @Field(type => RelayOrderByGQL, { nullable: true })
    order_by?: RelayOrderBy<any>; // max number to return
  }
  return OrderByFilter;
}
