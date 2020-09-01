import { ClassType } from '../../../helpers/classtype';
export declare function withPaginationFilter<TFilterBase extends ClassType<Record<string, any>>>(Base: TFilterBase): {
    new (...args: any[]): {
        [x: string]: any;
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        id?: string | undefined;
    };
} & TFilterBase;
