import { Oid } from '@rumbleship/types';
import { Model } from 'sequelize-typescript';

export function createWhereClauseWith<T extends Model<T>>(filter: any): any {
  if (filter.id) {
    const oid = new Oid(filter.id);
    const { id: databaseId } = oid.unwrap();
    delete filter.id;
    Reflect.set(filter, 'id', databaseId);
  }
  return filter;
}
