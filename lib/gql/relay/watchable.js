"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSubscriptionWatchList = exports.getWatchlistMetadata = exports.Watchable = exports.WATCH_LIST_METADATA = void 0;
exports.WATCH_LIST_METADATA = Symbol('WatchListMetadata');
function Watchable(target, key) {
    const watchListMetadata = getWatchlistMetadata(target);
    if (!watchListMetadata.includes(key)) {
        watchListMetadata.push(key);
        Reflect.defineMetadata(exports.WATCH_LIST_METADATA, watchListMetadata, target);
    }
}
exports.Watchable = Watchable;
function getWatchlistMetadata(from) {
    let metadata = Reflect.getMetadata(exports.WATCH_LIST_METADATA, from);
    if (!metadata && from.prototype) {
        metadata = Reflect.getMetadata(exports.WATCH_LIST_METADATA, from.prototype);
    }
    return metadata !== null && metadata !== void 0 ? metadata : [];
}
exports.getWatchlistMetadata = getWatchlistMetadata;
function buildSubscriptionWatchList(from, options) {
    var _a;
    const watchListMetadata = getWatchlistMetadata(from);
    const watchList = {};
    for (const key of watchListMetadata) {
        if ((_a = options === null || options === void 0 ? void 0 : options.exclude) === null || _a === void 0 ? void 0 : _a.some(excluded => excluded === key)) {
            continue;
        }
        Reflect.set(watchList, key, key);
    }
    if (options === null || options === void 0 ? void 0 : options.add) {
        for (const key in options.add) {
            if (!watchList.hasOwnProperty(key)) {
                Reflect.set(watchList, key, key);
            }
        }
    }
    return watchList;
}
exports.buildSubscriptionWatchList = buildSubscriptionWatchList;
//# sourceMappingURL=watchable.js.map