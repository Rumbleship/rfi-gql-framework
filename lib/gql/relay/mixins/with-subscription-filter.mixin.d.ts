import { ClassType } from '../../../helpers/classtype';
export interface SubscriptionWatchFilter {
    watch_list?: string[];
    id?: string;
}
/**
 * See @Watchable decorator and buildSubscriptionWatchList for details
 * on how to add attributes that can be watched for change
 * @param Base
 */
export declare function withSubscriptionFilter<TFilterBase extends ClassType<Record<string, any>>>(Base: TFilterBase, watchListEnumNameOrEnum: string | {
    [x: string]: string;
}): {
    new (...args: any[]): {
        [x: string]: any;
        watch_list?: string[] | undefined;
        id?: string | undefined;
    };
} & TFilterBase;
