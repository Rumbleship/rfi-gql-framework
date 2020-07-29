import { buildDbName } from 'src';

test('it separates db name and suffix with a single `_`', () => {
  expect(buildDbName('foo', 'bar')).toBe('foo_bar');
  expect(buildDbName('foo', '_bar')).toBe('foo_bar');
});
test('it doesnt require a suffix', () => {
  expect(buildDbName('foo')).toBe('foo');
});

test('a database name is required', () => {
  expect(() => buildDbName()).toThrowError();
});
