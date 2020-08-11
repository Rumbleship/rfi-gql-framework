import { ClassType } from '../helpers/classtype';

export const WATCH_LIST_METADATA = Symbol('WatchListMetadata');

export function WatchList(target: object, key: string) {
  const watchListMetadata: string[] = getWatchlistMetadata(target as any);
  watchListMetadata.push(key);
  Reflect.defineMetadata(WATCH_LIST_METADATA, watchListMetadata, target);
}

export function getWatchlistMetadata<Base extends object>(from: ClassType<Base>) {
  let metadata = Reflect.getMetadata(WATCH_LIST_METADATA, from);
  if (!metadata && from.prototype) {
    metadata = Reflect.getMetadata(WATCH_LIST_METADATA, from.prototype);
  }
  return metadata ?? [];
}

export function buildSubscriptionWatchList<Base extends object>(
  from: ClassType<Base>,
  options?: {
    exclude?: string[];
    add?: string[];
  }
) {
  const watchListMetadata = getWatchlistMetadata(from);
  const watchList: { [x: string]: string } = {};
  for (const key of watchListMetadata) {
    if (options?.exclude?.some(excluded => excluded === key)) {
      continue;
    }
    Reflect.set(watchList, key, key);
  }
  if (options?.add) {
    for (const key in options.add) {
      if (!watchList.hasOwnProperty(key)) {
        Reflect.set(watchList, key, key);
      }
    }
  }
  return watchList;
}
