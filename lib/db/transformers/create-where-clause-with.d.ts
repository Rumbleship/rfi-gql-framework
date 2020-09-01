import { Oid } from '@rumbleship/oid';
import { WhereOptions } from 'sequelize/types';
/**
 *
 * @param filter
 * @return a filter with the string or Oid id transformed to dbid, and date-filters converted
 */
export declare function createWhereClauseWith<TFilter extends Record<string, any> & {
    id?: string | Oid;
}>(filter: TFilter): WhereOptions;
