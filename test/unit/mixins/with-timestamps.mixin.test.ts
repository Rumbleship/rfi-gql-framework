import { withTimeStamps, AttribType } from './../../../src';

class Base {
  base_attr: string = 'base_attr';
}
describe('Given: an object decorated with timestamps', () => {
  class HasTimestamps extends withTimeStamps(AttribType.Obj, Base) {}
  const instance = new HasTimestamps();
  test.each(['created_at', 'updated_at', 'deleted_at', 'base_attr'])(
    'Then: an instance inherits the key `%s`',
    attr => {
      expect(attr in instance);
    }
  );
});
