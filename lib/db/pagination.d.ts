export declare function calculateBeforeAndAfter(offset: number, limit: number, count: number): {
    pageBefore: boolean;
    pageAfter: boolean;
};
export declare function calculateLimitAndOffset(after?: string, first?: number, before?: string, last?: number): {
    offset: number;
    limit: number;
};
