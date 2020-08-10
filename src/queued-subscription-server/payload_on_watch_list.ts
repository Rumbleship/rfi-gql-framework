import { NodeChangePayload } from '../';

export function payloadOnWatchList(nodePayload: NodeChangePayload, watchList?: string[]) {
  if (!watchList || watchList.length === 0) {
    return true;
  }
  if (
    nodePayload.deltas.some(delta => {
      return watchList.includes(delta.key);
    })
  ) {
    return true;
  }
  return false;
}
