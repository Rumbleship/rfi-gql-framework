import { RelayOrderBy } from '../../gql/scalars/relay-order-by.scalar';
import { OrderItem } from 'sequelize';

export function createOrderClause<T>(orderBy?: RelayOrderBy<T>): OrderItem[] {
  if (orderBy?.keys && orderBy.keys.length) {
    return orderBy.keys;
  } else {
    return [['updated_at', 'DESC']];
  }
}
