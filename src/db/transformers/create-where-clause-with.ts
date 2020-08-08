import { Oid } from '@rumbleship/oid';
import { convertToSequelizeDateFilters } from './convert-to-sequelize-date-filters';

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
    const ids_for_filter = Object.keys(filter).filter(k => k && k.match(/_id$/));
    for (const id_field of ids_for_filter) {
      const oid = new Oid(Reflect.get(filter, id_field));
      const { id } = oid.unwrap();
      Reflect.set(filter, id_field, id);
    }
  }
  /***
   * Look for any DateRange attributes and convert to sequelize operations
   *
   */
  filter = convertToSequelizeDateFilters(filter, '_at', '_between');
  return filter;
}
