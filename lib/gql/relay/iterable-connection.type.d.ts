import { Connection, Node, RelayFilterBase } from './relay.interface';
import { PaginationQuery } from './pagination-query.interface';
/**
 * Helper to iterate over an *internally* facing collection.
 *
 * If you're iterating over a pagable connection at the API layer
 * @see {iterable-external-connection.type.ts}
 */
export declare class IterableConnection<T extends Node<T>, TFilter extends PaginationQuery | RelayFilterBase<TFilter>> implements AsyncIterable<T> {
    private filterBy;
    private nextPage;
    constructor(filterBy: TFilter, nextPage: (filter: TFilter) => Promise<Connection<T>>);
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
