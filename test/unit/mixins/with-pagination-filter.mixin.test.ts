import { withPaginationFilter } from './../../../src';

class Base {
  base_attr = 'base_attr';
}
describe('Given: an object decorated with orderBy filter', () => {
  class HasTimestampsFilter extends withPaginationFilter(Base) {}
  const instance = new HasTimestampsFilter();
  test.each(['first', 'after', 'last', 'before', 'id', 'base_attr'])(
    'Then: an instance inherits the key `%s`',
    attr => {
      expect(attr in instance);
    }
  );
});
