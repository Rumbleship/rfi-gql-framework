import { ClassType } from '../helpers';
import { withOrderByFilter } from './with_order_by_filter';
import { withPaginationFilter } from './with_pagination_filter';
import { withTimeStampsFilter } from './with_timestamps_filter';

export class Empty {}

export function withOrderByPaginationTimeStampsFilter<TBase extends ClassType<any>>(Base: TBase) {
  return withOrderByFilter(withPaginationFilter(withTimeStampsFilter(Base ? Base : Empty)));
}
