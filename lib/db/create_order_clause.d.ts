import { RelayOrderBy } from '../gql/relay_order_by.type';
import { OrderItem } from 'sequelize';
export declare function createOrderClause<T>(orderBy?: RelayOrderBy<T>): OrderItem[];
