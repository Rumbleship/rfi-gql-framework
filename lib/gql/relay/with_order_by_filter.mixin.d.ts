import { RelayOrderBy } from '../scalars/relay-order-by.scalar';
import { ClassType } from '../../helpers';
export declare function withOrderByFilter<TBase extends ClassType<any>>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        order_by?: RelayOrderBy<any> | undefined;
    };
} & TBase;
