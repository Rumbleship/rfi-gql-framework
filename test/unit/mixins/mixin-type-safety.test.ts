import { ClassType } from './../../../src/helpers/classtype';
import { AttribType } from './../../../src/gql/relay/attrib.enum';
import 'reflect-metadata';
import * as Mixins from './../../../src/gql/relay/mixins';

class Base {
  base_attr: string = 'base_attr';
}
describe.each(Object.entries(Mixins))(
  'Given: a base class decorated with `%s`',
  (mixin_name, MixinFn) => {
    const args = MixinFn === Mixins.withTimeStamps ? [AttribType.Obj, Base] : [Base];
    class MixedIn extends (MixinFn as (...args: any[]) => ClassType<Base>)(...args) {}
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
  }
);
