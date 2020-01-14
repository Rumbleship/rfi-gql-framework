"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper class that takes a function to 'get next page' of a pagable collection
 *
 */
class IterableConnection {
    constructor(filterBy, nextPage) {
        this.filterBy = filterBy;
        this.nextPage = nextPage;
    }
    [Symbol.asyncIterator]() {
        const filterBy = {};
        Object.assign(filterBy, this.filterBy); // shallow copy as we track where we are
        const nextPage = this.nextPage;
        let connection;
        let itemPosition = 0;
        return {
            async next() {
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
                    value: null
                };
            }
        };
    }
}
exports.IterableConnection = IterableConnection;
//# sourceMappingURL=iterable-connection.type.js.map