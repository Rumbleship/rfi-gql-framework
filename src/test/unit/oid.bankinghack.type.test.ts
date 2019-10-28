import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { Oid } from '@rumbleship/oid';
import { createWhereClauseWith } from '../../gql/create-where-clause-with';

describe('When the banking hack of tilde optional is set:', () => {
  test('That an Oid can be created from its part and then destructured.', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.UnregisterScopes();
    Oid.RegisterScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    const { scope, id } = oid.unwrap();
    expect(scope).toBe(PAYMENT_REQUEST);
    expect(id).toBe(OBJECT_ID1);
  });
  test('That an Oid cannot be created without the scope being registered first', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.UnregisterScopes();
    const t = () => {
      Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    };
    expect(t).toThrow();
  });

  test('That an oid can be reconstructed from a persisted value created with the ~ prefex', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.UnregisterScopes();
    Oid.RegisterScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
    const newOid = new Oid(oidAsString);
    expect(newOid).toEqual(oid);
  });

  test('That an oid can be reconstructed from a persisted value without a prefix', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.UnregisterScopes();
    Oid.RegisterScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString[0]).toBe('~');
    const newOid = new Oid(oidAsString.substring(1));
    expect(newOid.unwrap()).toEqual(oid.unwrap());
  });

  test('An OID knows how to create a `{where: {} }` finder both with a tilde and without', () => {
    Oid.RegisterScope('BankAccount');
    const uuid = uuidv4();
    const oid: Oid = Oid.Create('BankAccount', uuid);
    const filter = { id: oid.toString() };
    expect(createWhereClauseWith(filter)).toEqual({
      id: uuid
    });
    const filterNoTilde = { id: oid.toString().substring(1) };
    expect(createWhereClauseWith(filterNoTilde)).toEqual({
      id: uuid
    });
  });
});
