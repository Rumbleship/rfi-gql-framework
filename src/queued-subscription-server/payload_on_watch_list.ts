import { NodeChangePayload } from '../app/server/rfi-pub-sub-engine.interface';

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
