import { ClassType } from '../helpers';
import { RelayOrderBy } from './relay_order_by.type';
export declare function withOrderByFilter<TBase extends ClassType<any>>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        order_by?: RelayOrderBy<any> | undefined;
    };
} & TBase;
