import { RelayOrderBy } from '../gql/relay_order_by.type';
import { OrderItem } from 'sequelize';

export function createOrderClause<T>(orderBy?: RelayOrderBy<T>): OrderItem[] {
  if (orderBy?.keys && orderBy.keys.length) {
    return orderBy.keys;
  } else {
    return [['id', 'DESC']];
  }
}
