import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { Oid } from '../../gql/index';

Oid.bankingHackTildeOptional = true;

describe('When the banking hack of tilde optional is set:', () => {
  test('That an Oid can be created from its part and then destructured.', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.unregisterScopes();
    Oid.registerScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
    const { scope, id } = oid.unwrap();
    expect(scope).toBe(PAYMENT_REQUEST);
    expect(id).toBe(OBJECT_ID1);
  });
  test('That an Oid cannot be created without the scope being registered first', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.unregisterScopes();
    const t = () => {
      Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
    };
    expect(t).toThrow();
  });

  test('That an oid can be reconstructed from a persisted value created with the ~ prefex', () => {
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

  test('That an oid can be reconstructed from a persisted value without a prefix', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.unregisterScopes();
    Oid.registerScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString[0]).toBe('~');
    const newOid = new Oid(oidAsString.substring(1));
    expect(newOid.unwrap()).toEqual(oid.unwrap());
  });
  test('That when the hack is set to false, the oid cannot be reconstructed from a persisted value without a prefix', () => {
    Oid.bankingHackTildeOptional = false;
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    Oid.unregisterScopes();
    Oid.registerScope(PAYMENT_REQUEST);
    const oid: Oid = Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString[0]).toBe('~');
    const newOid = new Oid(oidAsString.substring(1));
    expect(() => newOid.unwrap()).toThrow();
    Oid.bankingHackTildeOptional = true;
  });

  test('An OID knows how to create a `{where: {} }` finder both with a tilde and without', () => {
    Oid.registerScope('BankAccount');
    const uuid = uuidv4();
    const oid: Oid = Oid.create('BankAccount', uuid);
    const filter = { id: oid.toString() };
    expect(Oid.createWhereClauseWith(filter)).toEqual({
      id: uuid
    });
    const filterNoTilde = { id: oid.toString().substring(1) };
    expect(Oid.createWhereClauseWith(filterNoTilde)).toEqual({
      id: uuid
    });
  });
});
