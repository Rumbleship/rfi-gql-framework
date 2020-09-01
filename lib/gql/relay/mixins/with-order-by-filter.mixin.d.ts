import { RelayOrderBy } from '../../scalars/relay-order-by.scalar';
import { ClassType } from '../../../helpers';
export declare function withOrderByFilter<TFilterBase extends ClassType<Record<string, any>>>(Base: TFilterBase): {
    new (...args: any[]): {
        [x: string]: any;
        order_by?: RelayOrderBy<any> | undefined;
    };
} & TFilterBase;
