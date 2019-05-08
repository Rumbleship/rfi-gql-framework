import { DateRange } from '../../../banking/src/scalars/daterange.type';
import { Op } from 'sequelize';

export function create_date_filter(
  filterBy: any,
  date_key: string,
  between?: DateRange,
  test_for_any?: boolean
) {
  if (between) {
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
    if (test_for_any !== undefined) {
      delete filterBy.verified;
      if (test_for_any) {
        Reflect.set(filterBy, date_key, { [Op.ne]: null });
      } else {
        Reflect.set(filterBy, date_key, { [Op.eq]: null });
      }
    }
  }
  return filterBy;
}
