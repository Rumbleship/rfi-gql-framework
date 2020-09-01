import { ClassType } from '../../helpers/classtype';
export declare const WATCH_LIST_METADATA: unique symbol;
export declare const Watchable: PropertyDecorator;
export declare function getWatchlistMetadata<Base extends Record<string, any>>(from: ClassType<Base>): Array<string>;
export declare function buildSubscriptionWatchList<Base extends Record<string, any>>(from: ClassType<Base>, options?: {
    exclude?: string[];
    add?: string[];
}): Record<string, string>;
