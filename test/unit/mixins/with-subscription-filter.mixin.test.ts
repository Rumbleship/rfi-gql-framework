import { withSubscriptionFilter } from '../../../src';

class Base {
  base_attr = 'base_attr';
}
describe('Given: an object decorated withSubscriptionFilter', () => {
  class HasSubscriptionFilter extends withSubscriptionFilter(Base, {}) {}
  const instance = new HasSubscriptionFilter();
  test.each(['watch_list', 'id', 'base_attr'])('Then: an instance inherits the key `%s`', attr => {
    expect(attr in instance);
  });
});
