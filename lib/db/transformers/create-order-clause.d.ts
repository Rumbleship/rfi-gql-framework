import { RelayOrderBy } from '../../gql/scalars/relay-order-by.scalar';
import { OrderItem } from 'sequelize';
export declare function createOrderClause<T>(orderBy?: RelayOrderBy<T>): OrderItem[];
