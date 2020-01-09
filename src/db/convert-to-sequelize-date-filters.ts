import { create_date_filter } from './date-range-filter';

/**
 * Processes a filter passed in by the framework and converts
 * @param filter An object that may contain properties matching *_between
 */
export function convertToSequelizeDateFilters<T extends object>(
  filter: T,
  date_suffix: string,
  range_suffix: string
): T {
  for (const key of Reflect.ownKeys(filter)) {
    if (typeof key === 'string') {
      if (key.endsWith(range_suffix)) {
        filter = create_date_filter(
          filter,
          key.substr(0, key.length - range_suffix.length) + date_suffix,
          Reflect.get(filter, key)
        );
        Reflect.deleteProperty(filter, key);
      }
    }
  }
  return filter;
}
