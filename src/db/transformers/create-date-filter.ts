import { Op } from 'sequelize';
import { DateRange } from '../../gql';

/**
 *
 * @param filterBy
 * @param date_key
 * @param between
 * @param test_for_any
 */
export function create_date_filter<TFilter extends Record<string, any>>(
  filterBy: TFilter,
  date_key: string,
  between?: DateRange,
  test_for_any?: boolean
): TFilter /* & lots of potential nested sequelize types we'll ignore for now*/ {
  if (between && between instanceof DateRange) {
    if (between.from && between.to) {
      Reflect.set(filterBy, date_key, {
        [Op.between]: [between.from, between.to]
      });
    } else {
      if (between.from) {
        Reflect.set(filterBy, date_key, { [Op.gte]: between.from });
      } else {
        if (between.to) {
          Reflect.set(filterBy, date_key, { [Op.lte]: between.to });
        }
      }
    }
  } else {
    /**
     * logic for for testing if a date is set at all.
     *
     * This is because a lot of our code uses a date as a flag as well as a date.
     *
     * For example, if the BankAccount.verified_at date is Null, then it hasnt been verified.
     *
     */
    if (test_for_any !== undefined) {
      if (test_for_any) {
        Reflect.set(filterBy, date_key, { [Op.ne]: null });
      } else {
        Reflect.set(filterBy, date_key, { [Op.eq]: null });
      }
    }
  }
  return filterBy;
}
