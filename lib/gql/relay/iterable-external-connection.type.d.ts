import { PageInfo } from './page-info.type';
import { PaginationQuery } from './pagination-query.interface';
import { Node, RelayFilterBase } from './relay.interface';
declare type ApiNode<T> = Omit<Node<T>, '_service'>;
interface ApiEdge<T extends ApiNode<T>> {
    node: T;
    cursor: string;
}
interface ApiConnection<T extends ApiNode<T>> {
    pageInfo: PageInfo;
    edges: Array<ApiEdge<T>>;
}
/**
 * Helper to iterate over an *externally* facing collection.
 *
 * If you're iterating over a pagable connection from the database
 * @see {iterable-connection.type.ts}
 */
export declare class IterableExternalConnection<T extends ApiNode<any>, TFilter extends PaginationQuery | RelayFilterBase<TFilter>> implements AsyncIterable<T> {
    private filterBy;
    private nextPage;
    constructor(filterBy: TFilter, nextPage: (filter: TFilter) => Promise<ApiConnection<T>>);
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
export {};
