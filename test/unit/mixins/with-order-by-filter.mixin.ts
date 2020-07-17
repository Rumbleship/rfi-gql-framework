import { withOrderByFilter } from './../../../src';

class Base {
  base_attr: string = 'base_attr';
}
describe('Given: an object decorated with orderBy filter', () => {
  class HasTimestampsFilter extends withOrderByFilter(Base) {}
  const instance = new HasTimestampsFilter();
  test.each(['order_by', 'base_attr'])('Then: an instance inherits the key `%s`', attr => {
    expect(attr in instance);
  });
});
