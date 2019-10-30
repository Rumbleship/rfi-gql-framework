import 'reflect-metadata';
import { Oid } from '@rumbleship/oid';
import { v4 as uuidv4 } from 'uuid';
import { createWhereClauseWith } from '../../gql/create-where-clause-with';

test('That an oid can be reconstructed from a persisted value', () => {
  const PAYMENT_REQUEST = 'PaymentRequest';
  const OBJECT_ID1 = '0001';
  const oid: Oid = Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
  const oidAsString = oid.toString();
  expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
  const newOid = new Oid(oidAsString);
  expect(newOid).toEqual(oid);
});
test('An OID knows how to create a `{where: {} }` finder', () => {
  const uuid = uuidv4();
  const oid: Oid = Oid.Create('BankAccount', uuid);
  const filter = { id: oid.toString() };
  expect(createWhereClauseWith(filter)).toEqual({
    id: uuid
  });
});

test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
  const id = 500;
  const oid: Oid = Oid.Create('BankAccount', id);
  const filter = { id: oid.toString() };
  expect(createWhereClauseWith(filter)).toEqual({
    id
  });
});
