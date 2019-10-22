import 'reflect-metadata';
import { Oid } from '@rumbleship/types';
import { v4 as uuidv4 } from 'uuid';
import { createWhereClauseWith } from '../../gql/create-where-clause-with';

test('That an oid can be reconstructed from a persisted value', () => {
  const PAYMENT_REQUEST = 'PaymentRequest';
  const OBJECT_ID1 = '0001';
  Oid.unregisterScopes();
  Oid.registerScope(PAYMENT_REQUEST);
  const oid: Oid = Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
  const oidAsString = oid.toString();
  expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
  const newOid = new Oid(oidAsString);
  expect(newOid).toEqual(oid);
});
test('An OID knows how to create a `{where: {} }` finder', () => {
  Oid.registerScope('BankAccount');
  const uuid = uuidv4();
  const oid: Oid = Oid.create('BankAccount', uuid);
  const filter = { id: oid.toString() };
  expect(createWhereClauseWith(filter)).toEqual({
    id: uuid
  });
});
test('A hash_id OID and a base64 hashid cant be registered fro the same scope', () => {
  Oid.unregisterScopes();
  Oid.registerScope('BankAccount', 'ba');
  const t = () => Oid.registerScope('BankAccount');
  expect(t).toThrow();
});
test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
  Oid.unregisterScopes();
  Oid.registerScope('BankAccount', 'ba');
  const id = 500;
  const oid: Oid = Oid.create('BankAccount', id);
  const filter = { id: oid.toString() };
  expect(createWhereClauseWith(filter)).toEqual({
    id
  });
});
