import { Oid } from '@rumbleship/oid';
import { WhereOptions } from 'sequelize/types';
import { convertToSequelizeDateFilters } from './convert-to-sequelize-date-filters';

/**
 *
 * @param filter
 * @return a filter with the string or Oid id transformed to dbid, and date-filters converted
 */
export function createWhereClauseWith<TFilter extends Record<string, any> & { id?: string | Oid }>(
  filter: TFilter
): WhereOptions {
  if (filter.id) {
    if (typeof filter.id === 'string') {
      filter.id = new Oid(filter.id);
    }
    if (filter.id instanceof Oid) {
      const { id: databaseId } = filter.id.unwrap();
      delete filter.id;
      Reflect.set(filter, 'id', databaseId);
    }
  }
  /***
   * Look for any DateRange attributes and convert to sequelize operations
   *
   */
  filter = convertToSequelizeDateFilters(filter, '_at', '_between');
  return filter;
}
