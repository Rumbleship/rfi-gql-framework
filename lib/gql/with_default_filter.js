"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDefaultFilter = exports.Empty = void 0;
const with_order_by_filter_1 = require("./with_order_by_filter");
const with_pagination_filter_1 = require("./with_pagination_filter");
const with_timestamps_filter_1 = require("./with_timestamps_filter");
class Empty {
}
exports.Empty = Empty;
function withDefaultFilter(Base) {
    return with_order_by_filter_1.withOrderByFilter(with_pagination_filter_1.withPaginationFilter(with_timestamps_filter_1.withTimeStampsFilter(Base ? Base : Empty)));
}
exports.withDefaultFilter = withDefaultFilter;
//# sourceMappingURL=with_default_filter.js.map