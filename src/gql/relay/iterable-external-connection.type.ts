import { PageInfo } from './page-info.type';
import { PaginationQuery } from './pagination-query.interface';
import { Node, RelayFilterBase } from './relay.interface';

type ApiNode<T> = Omit<Node<T>, '_service'>;
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
export class IterableExternalConnection<
  T extends ApiNode<any>,
  TFilter extends PaginationQuery | RelayFilterBase<TFilter>
> implements AsyncIterable<T> {
  constructor(
    private filterBy: TFilter,
    private nextPage: (filter: TFilter) => Promise<ApiConnection<T>>
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<T> {
    const filterBy: TFilter = ({} as any) as TFilter;
    Object.assign(filterBy, this.filterBy); // shallow copy as we track where we are
    const nextPage = this.nextPage;
    let connection: ApiConnection<T>;
    let itemPosition = 0;
    return {
      async next(): Promise<IteratorResult<T>> {
        if (!connection) {
          connection = await nextPage(filterBy);
        }
        if (itemPosition < connection.edges.length) {
          return {
            done: false,
            value: connection.edges[itemPosition++].node
          };
        }
        if (connection.pageInfo.hasNextPage) {
          filterBy.after = connection.pageInfo.endCursor;
          connection = await nextPage(filterBy);
          if (connection.edges.length) {
            itemPosition = 0;
            return {
              done: false,
              value: connection.edges[itemPosition++].node
            };
          }
        }
        return {
          done: true,
          value: null as any
        };
      }
    };
  }
}
