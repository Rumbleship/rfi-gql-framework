import { ClassType } from '../helpers';
export declare class Empty {
}
export declare function withOrderByPaginationTimeStampsFilter<TBase extends ClassType<any>>(Base: TBase): ({
    new (...args: any[]): {
        [x: string]: any;
        order_by?: import("./relay_order_by.type").RelayOrderBy<any> | undefined;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        id?: string | undefined;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        created_at?: Date | undefined;
        created_between?: import("./daterange.type").DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: import("./daterange.type").DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: import("./daterange.type").DateRange | undefined;
    };
} & typeof Empty) | ({
    new (...args: any[]): {
        [x: string]: any;
        order_by?: import("./relay_order_by.type").RelayOrderBy<any> | undefined;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        id?: string | undefined;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        created_at?: Date | undefined;
        created_between?: import("./daterange.type").DateRange | undefined;
        updated_at?: Date | undefined;
        updated_between?: import("./daterange.type").DateRange | undefined;
        deleted_at?: Date | undefined;
        deleted_between?: import("./daterange.type").DateRange | undefined;
    };
} & TBase);
