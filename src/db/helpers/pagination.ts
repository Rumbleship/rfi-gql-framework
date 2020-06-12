import { fromBase64 } from '../../helpers';

const DEFAULT_LIMIT_NUM = 20;

export function calculateBeforeAndAfter(offset: number, limit: number, count: number) {
  return {
    pageBefore: offset === 0 ? false : true,
    pageAfter: offset + limit < count ? true : false
  };
}

export function calculateLimitAndOffset(
  after?: string,
  first?: number,
  before?: string,
  last?: number
) {
  let offset = 0;
  let limit = first ? first : DEFAULT_LIMIT_NUM; // if we have no after, or before...
  if (after) {
    if (before) {
      throw new Error('Incompatible use of both before and after');
    }
    if (last) {
      throw new Error('Incompatible use of both last and after');
    }
    offset = 1 + parseInt(fromBase64(after), 10);
    if (first) {
      limit = first;
    }
  }
  if (before) {
    if (first) {
      throw new Error('Incompatible use of both first and before');
    }
    offset = parseInt(fromBase64(before), 10);
    offset = offset < 0 ? 0 : offset;
    if (last) {
      limit = last;
    }
    if (offset < limit) {
      limit = offset;
      offset = 0;
    } else {
      offset = offset - limit;
    }
  }
  return { offset, limit };
}
