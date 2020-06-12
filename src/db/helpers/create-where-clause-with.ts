import { Oid } from '@rumbleship/oid';
import { convertToSequelizeDateFilters } from '../transformers';

export function createWhereClauseWith(filter: any): any {
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
