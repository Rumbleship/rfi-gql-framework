import { ClassType } from '../../helpers/classtype';

export const WATCH_LIST_METADATA = Symbol('WatchListMetadata');

export const Watchable: PropertyDecorator = (target: Record<string, any>, key: string | symbol) => {
  const watchListMetadata: Array<string | symbol> = getWatchlistMetadata(target as any);
  if (!watchListMetadata.includes(key)) {
    watchListMetadata.push(key);
    Reflect.defineMetadata(WATCH_LIST_METADATA, watchListMetadata, target);
  }
};

export function getWatchlistMetadata<Base extends Record<string, any>>(
  from: ClassType<Base>
): Array<string> {
  let metadata = Reflect.getMetadata(WATCH_LIST_METADATA, from);
  if (!metadata && from.prototype) {
    metadata = Reflect.getMetadata(WATCH_LIST_METADATA, from.prototype);
  }
  return metadata ?? [];
}

export function buildSubscriptionWatchList<Base extends Record<string, any>>(
  from: ClassType<Base>,
  options?: {
    exclude?: string[];
    add?: string[];
  }
): Record<string, string> {
  const watchListMetadata = getWatchlistMetadata(from);
  const watchList: Record<string, string> = {};
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
