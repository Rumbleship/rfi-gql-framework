import { ClassType } from '../helpers/classtype';
export interface SubscriptionWatchFilter {
    watch_list?: string[];
    id?: string;
}
/**
 *
 * @param Base
 */
export declare function withSubscriptionFilter<TFilterBase extends ClassType<object>, TEnumPropertyNames extends {
    [name: string]: any;
}>(Base: TFilterBase, propertyNames: TEnumPropertyNames): {
    new (...args: any[]): {
        watch_list?: string[] | undefined;
        id?: string | undefined;
    };
} & TFilterBase;