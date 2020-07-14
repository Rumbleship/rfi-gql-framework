import { RelayInputTypeBase } from './../../src/gql/relay/relay.interface';
import { Field } from 'type-graphql';
import {
  AliasFromDeprecatedField,
  cloneAndTransposeDeprecatedValues,
  withOrderByFilter,
  withPaginationFilter,
  withTimeStampsFilter,
  RelayFilterBase
} from '../../src/gql/';
import { modelKey } from './../../src/db';
import { plainToClass } from 'class-transformer';

class HasDeprecatedAttribs {
  @AliasFromDeprecatedField('a_deprecated_field')
  new_field?: string;

  @Field({ nullable: true })
  a_deprecated_field?: string;

  @Field()
  unrelated_field?: string;
}

class FilterWithDeprecatedAttribs
  extends withOrderByFilter(withPaginationFilter(withTimeStampsFilter(HasDeprecatedAttribs)))
  implements RelayFilterBase<HasDeprecatedAttribs> {}

class InputWithDeprecatedAttribs extends HasDeprecatedAttribs
  implements RelayInputTypeBase<HasDeprecatedAttribs> {}

class NoDeprecatedAttribs {
  @Field()
  a_field?: string;
}
class FilterNothingDeprecated
  extends withOrderByFilter(withPaginationFilter(withTimeStampsFilter(NoDeprecatedAttribs)))
  implements RelayFilterBase<NoDeprecatedAttribs> {}
class InputNothingDeprecated extends NoDeprecatedAttribs
  implements RelayInputTypeBase<NoDeprecatedAttribs> {}

/**
 * We just use `plainToClass` for this test, as that's what type-graphql uses
 * underneath the hood to do the transformation. Don't need to bring in the
 * entire type-graphql stack for the unit test.
 */
describe.each(['a_deprecated_field', 'new_field'])(
  'When: using a plain object whose `%s` field is populated as input',
  field => {
    const plain = { [field]: field, unrelated_field: 'unrelated' };
    let transformed: HasDeprecatedAttribs;
    beforeAll(() => {
      transformed = plainToClass(HasDeprecatedAttribs, plain);
    });
    test('Then: both the new field is populated', () => {
      expect(transformed.new_field).toBe(field);
    });
    test('Then: both the deprecated field is populated', () => {
      expect(transformed.a_deprecated_field).toBe(field);
    });
    test('Then: the unrelated field is untouched', () => {
      expect(transformed.unrelated_field).toBe(plain.unrelated_field);
    });
  }
);

describe('Given: an instantiated relay node', () => {
  const node = new HasDeprecatedAttribs();
  Reflect.set(node, modelKey, 'a fake model');
  describe('When: passed to cloneAndTransposeDeprecatedValues', () => {
    test('Then: it throws', () => {
      expect(() => cloneAndTransposeDeprecatedValues(node as any)).toThrow();
    });
  });
});

describe('Given: an instantiated filter', () => {
  describe('And: 1+ attribute is marked as deprecated', () => {
    const filter = new FilterWithDeprecatedAttribs();
    filter.unrelated_field = 'unrelated';
    filter.new_field = 'interesting_value';
    filter.a_deprecated_field = 'interesting_value';

    const processed = cloneAndTransposeDeprecatedValues(filter);
    describe('When: passed to cloneAndTransposeDeprecatedValues', () => {
      test('Then: the new field has a value', () => {
        expect(processed.new_field).toBe('interesting_value');
      });
      test('Then: the key for deprecated field is completely removed', () => {
        expect(Object.keys(processed).includes('a_deprecated_field')).toBeFalsy();
      });
      test('Then: the input is cloned', () => {
        // double equals is very important!
        // tslint:disable-next-line: triple-equals
        expect(processed == filter).toBe(false);
      });
    });
  });
  describe('And: no attributes are marked as deprecated', () => {
    const filter = new FilterNothingDeprecated();
    filter.a_field = 'interesting_value';
    const processed = cloneAndTransposeDeprecatedValues(filter);
    describe('When: passed to cloneAndTransposeDeprecatedValues', () => {
      test('Then: the input is not cloned', () => {
        expect(processed === filter).toBe(true);
      });
    });
  });
});

describe('Given: an instantiated Input', () => {
  describe('And: 1+ attribute is marked as deprecated', () => {
    const filter = new InputWithDeprecatedAttribs();
    filter.unrelated_field = 'unrelated';
    filter.new_field = 'interesting_value';
    filter.a_deprecated_field = 'interesting_value';

    const processed = cloneAndTransposeDeprecatedValues(filter);
    describe('When: passed to cloneAndTransposeDeprecatedValues', () => {
      test('Then: the new field has a value', () => {
        expect(processed.new_field).toBe('interesting_value');
      });
      test('Then: the key for deprecated field is completely removed', () => {
        expect(Object.keys(processed).includes('a_deprecated_field')).toBeFalsy();
      });
      test('Then: the input is cloned', () => {
        // double equals is very important!
        // tslint:disable-next-line: triple-equals
        expect(processed == filter).toBe(false);
      });
    });
  });
  describe('And: no attributes are marked as deprecated', () => {
    const filter = new InputNothingDeprecated();
    filter.a_field = 'interesting_value';
    const processed = cloneAndTransposeDeprecatedValues(filter);
    describe('When: passed to cloneAndTransposeDeprecatedValues', () => {
      test('Then: the input is not cloned', () => {
        expect(processed === filter).toBe(true);
      });
    });
  });
});
