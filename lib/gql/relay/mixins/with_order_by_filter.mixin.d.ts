import { RelayOrderBy } from '../../scalars/relay-order-by.scalar';
import { ClassType } from '../../../helpers';
export declare function withOrderByFilter<TFilterBase extends ClassType<object>>(Base: TFilterBase): {
    new (...args: any[]): {
        order_by?: RelayOrderBy<any> | undefined;
    };
} & TFilterBase;
