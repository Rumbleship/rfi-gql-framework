import { DateRange } from '../../gql';
/**
 *
 * @param filterBy
 * @param date_key
 * @param between
 * @param test_for_any
 */
export declare function create_date_filter<TFilter extends Record<string, any>>(filterBy: TFilter, date_key: string, between?: DateRange, test_for_any?: boolean): TFilter;
