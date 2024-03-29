import { Connection, Node, RelayFilterBase } from './relay.interface';
import { PaginationQuery } from './pagination-query.interface';

/**
 * Helper to iterate over an *internally* facing collection.
 *
 * If you're iterating over a pagable connection at the API layer
 * @see {iterable-external-connection.type.ts}
 */
export class IterableConnection<
  T extends Node<T>,
  TFilter extends PaginationQuery | RelayFilterBase<TFilter>
> implements AsyncIterable<T> {
  constructor(
    private filterBy: TFilter,
    private nextPage: (filter: TFilter) => Promise<Connection<T>>
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<T> {
    const filterBy: TFilter = ({} as any) as TFilter;
    Object.assign(filterBy, this.filterBy); // shallow copy as we track where we are
    const nextPage = this.nextPage;
    let connection: Connection<T>;
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
