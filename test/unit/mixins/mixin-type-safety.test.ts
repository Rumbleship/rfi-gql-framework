import 'reflect-metadata';
import { AttribType } from './../../../src/gql/relay/attrib.enum';
import * as Mixins from './../../../src/gql/relay/mixins';

class Base {
  static instantiation_count: number = 0;
  base_attr: string = 'base_attr';
  constructor() {
    Base.instantiation_count++;
  }
}

describe('Given: `withOrderByFilter` mixed in', () => {
  class MixedIn extends Mixins.withOrderByFilter(Base) {}
  const instance = new MixedIn();
  test('Then: types prevent an unknown attribute from being set on instance', () => {
    // @ts-expect-error
    instance.foo = 'foo';
    expect(true).toBe(true);
  });
  test('Then: compiler can be overwritten to set a random attribute on instance', () => {
    (instance as any).foo = 'foo';
    expect((instance as any).foo).toBe('foo');
  });
});

describe('Given: `withPaginationFilter` mixed in', () => {
  class MixedIn extends Mixins.withPaginationFilter(Base) {}
  const instance = new MixedIn();
  test('Then: types prevent an unknown attribute from being set on instance', () => {
    // @ts-expect-error
    instance.foo = 'foo';
    expect(true).toBe(true);
  });
  test('Then: compiler can be overwritten to set a random attribute on instance', () => {
    (instance as any).foo = 'foo';
    expect((instance as any).foo).toBe('foo');
  });
});

describe('Given: `withTimeStamps` mixed in', () => {
  class MixedIn extends Mixins.withTimeStamps(AttribType.Obj, Base) {}
  const instance = new MixedIn();
  test('Then: types prevent an unknown attribute from being set on instance', () => {
    // @ts-expect-error
    instance.foo = 'foo';
    expect(true).toBe(true);
  });
  test('Then: compiler can be overwritten to set a random attribute on instance', () => {
    (instance as any).foo = 'foo';
    expect((instance as any).foo).toBe('foo');
  });
});

describe('Given: `withTimeStampsFilter` mixed in', () => {
  class MixedIn extends Mixins.withTimeStampsFilter(Base) {}
  const instance = new MixedIn();
  test('Then: types prevent an unknown attribute from being set on instance', () => {
    // @ts-expect-error
    instance.foo = 'foo';
    expect(true).toBe(true);
  });
  test('Then: compiler can be overwritten to set a random attribute on instance', () => {
    (instance as any).foo = 'foo';
    expect((instance as any).foo).toBe('foo');
  });
});


describe('Given: `withSubscriptionFilter` mixed in', () => {
  class MixedIn extends Mixins.withSubscriptionFilter(Base, {}) {}
  const instance = new MixedIn();
  test('Then: types prevent an unknown attribute from being set on instance', () => {
    // @ts-expect-error
    instance.foo = 'foo';
    expect(true).toBe(true);
  });
  test('Then: compiler can be overwritten to set a random attribute on instance', () => {
    (instance as any).foo = 'foo';
    expect((instance as any).foo).toBe('foo');
  });
});

/**
 * If this test fails, you've likely added a mixin to `src/gql/relay/mixins/` and
 * not added the corresponding test here. Due to compile-time/run-time differences,
 * you have to add this test as boilerplate. Copy/paste the boilerplate in above
 * tests and change to use your new mixin.
 */
test('Every exported test mixin has a corresponding type-safety test defined in this file', () => {
  expect(Base.instantiation_count).toBe(Object.keys(Mixins).length);
});
