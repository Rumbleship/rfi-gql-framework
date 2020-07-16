import { RelayOrderBy } from './../../src/gql/';
import { createOrderClause } from './../../src/db';
test('Passed order_by keys are used', () => {
  const order_by: RelayOrderBy<any> = { keys: [['key', 'DESC']] };
  expect(createOrderClause(order_by)).toEqual([['key', 'DESC']]);
});

test('Defaults to [[updated_at, "DESC"]]', () => {
  expect(createOrderClause()).toEqual([['updated_at', 'DESC']]);
});
