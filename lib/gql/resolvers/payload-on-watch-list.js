"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payloadOnWatchList = void 0;
function payloadOnWatchList(nodePayload, watchList) {
    if (!watchList || watchList.length === 0) {
        return true;
    }
    if (nodePayload.deltas.some(delta => {
        return watchList.includes(delta.key);
    })) {
        return true;
    }
    return false;
}
exports.payloadOnWatchList = payloadOnWatchList;
//# sourceMappingURL=payload-on-watch-list.js.map