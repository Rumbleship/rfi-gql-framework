import { ClassType } from '../helpers';
export declare function withPaginationFilter<TBase extends ClassType<any>>(Base: TBase): {
    new (...args: any[]): {
        [x: string]: any;
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        id?: string | undefined;
    };
} & TBase;
