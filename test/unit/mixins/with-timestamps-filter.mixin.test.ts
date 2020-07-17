import { withTimeStampsFilter } from './../../../src';

class Base {
  base_attr: string = 'base_attr';
}
describe('Given: an object decorated with timestamp filter', () => {
  class HasTimestampsFilter extends withTimeStampsFilter(Base) {}
  const instance = new HasTimestampsFilter();
  test.each([
    'created_at',
    'created_between',
    'updated_at',
    'updated_between',
    'deleted_at',
    'deleted_between',
    'base_attr'
  ])('Then: an instance inherits the key `%s`', attr => {
    expect(attr in instance);
  });
});
