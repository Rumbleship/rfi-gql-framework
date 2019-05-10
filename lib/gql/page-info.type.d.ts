export declare class PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
    setInfo(next: boolean, prev: boolean, start?: string, end?: string): PageInfo;
}
