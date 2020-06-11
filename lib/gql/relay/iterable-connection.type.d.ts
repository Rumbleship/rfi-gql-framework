import { Connection, Node } from './relay.interface';
import { PaginationQuery } from './pagination-query.interface';
/**
 * Helper class that takes a function to 'get next page' of a pagable collection
 *
 */
export declare class IterableConnection<T extends Node<T>, TFilter extends PaginationQuery> implements AsyncIterable<T> {
    private filterBy;
    private nextPage;
    constructor(filterBy: TFilter, nextPage: (filter: TFilter) => Promise<Connection<T>>);
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
