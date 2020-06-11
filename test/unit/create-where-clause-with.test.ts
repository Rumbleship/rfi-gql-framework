import 'reflect-metadata';
import { Oid } from '@rumbleship/oid';
import { createWhereClauseWith } from '../../gql/create-where-clause-with';

test('That an oid can be reconstructed from a persisted value', () => {
  const PAYMENT_REQUEST = 'PaymentRequest';
  const OBJECT_ID1 = 1;
  const oid: Oid = Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
  const oidAsString = oid.toString();
  expect(oidAsString).toMatchInlineSnapshot(`"pr_ovjey6d"`);
  const newOid = new Oid(oidAsString);
  expect(newOid).toEqual(oid);
});

test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
  const id = 500;
  const oid: Oid = Oid.Create('BankAccount', id);
  const filter = { id: oid.toString() };
  expect(createWhereClauseWith(filter)).toEqual({
    id
  });
});
