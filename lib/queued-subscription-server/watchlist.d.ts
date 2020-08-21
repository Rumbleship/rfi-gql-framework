import { ClassType } from '../helpers/classtype';
export declare const WATCH_LIST_METADATA: unique symbol;
export declare function WatchList(target: object, key: string): void;
export declare function getWatchlistMetadata<Base extends object>(from: ClassType<Base>): any;
export declare function buildSubscriptionWatchList<Base extends object>(from: ClassType<Base>, options?: {
    exclude?: string[];
    add?: string[];
}): {
    [x: string]: string;
};
