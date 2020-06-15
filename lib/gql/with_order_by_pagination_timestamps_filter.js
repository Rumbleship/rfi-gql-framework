"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withOrderByPaginationTimeStampsFilter = exports.Empty = void 0;
const with_order_by_filter_1 = require("./with_order_by_filter");
const with_pagination_filter_1 = require("./with_pagination_filter");
const with_timestamps_filter_1 = require("./with_timestamps_filter");
class Empty {
}
exports.Empty = Empty;
function withOrderByPaginationTimeStampsFilter(Base) {
    return with_order_by_filter_1.withOrderByFilter(with_pagination_filter_1.withPaginationFilter(with_timestamps_filter_1.withTimeStampsFilter(Base ? Base : Empty)));
}
exports.withOrderByPaginationTimeStampsFilter = withOrderByPaginationTimeStampsFilter;
//# sourceMappingURL=with_order_by_pagination_timestamps_filter.js.map