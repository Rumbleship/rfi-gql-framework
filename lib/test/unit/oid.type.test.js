"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const uuid_1 = require("uuid");
const gql_1 = require("../../gql");
describe('That objects of type Oid work as expected:', () => {
    test('That scopes can be added and that the key be the same everytime', () => {
        const scope_id1 = gql_1.Oid.registerScope('PaymentRequest');
        expect(scope_id1).toMatchInlineSnapshot(`558459262`);
        const scope_id2 = gql_1.Oid.registerScope('BankAccount');
        expect(scope_id2).toMatchInlineSnapshot(`2979548881`);
    });
    test('That a scope can only be registered once', () => {
        const t = () => {
            gql_1.Oid.registerScope('BatchClass');
            gql_1.Oid.registerScope('BatchClass');
        };
        expect(t).toThrow();
    });
    test('That an Oid can be created from its part and then destructured.', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = gql_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const { scope, id } = oid.unwrap();
        expect(scope).toBe(PAYMENT_REQUEST);
        expect(id).toBe(OBJECT_ID1);
    });
    test('That an hash_id Oid can be created from its part and then destructured.', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const PAYMENT_REQUEST_SHORT_CODE = 'pr';
        const OBJECT_ID1 = 1;
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope(PAYMENT_REQUEST, PAYMENT_REQUEST_SHORT_CODE);
        const oid = gql_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const { scope, id } = oid.unwrap();
        expect(scope).toBe(PAYMENT_REQUEST);
        expect(id).toBe(OBJECT_ID1);
    });
    test('That an Oid cannot be created without the scope being registered first', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        gql_1.Oid.unregisterScopes();
        const t = () => {
            gql_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        };
        expect(t).toThrow();
    });
    test('That an oid can be reconstructed from a persisted value', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = gql_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
        const newOid = new gql_1.Oid(oidAsString);
        expect(newOid).toEqual(oid);
    });
    test('An OID knows how to create a `{where: {} }` finder', () => {
        gql_1.Oid.registerScope('BankAccount');
        const uuid = uuid_1.v4();
        const oid = gql_1.Oid.create('BankAccount', uuid);
        const filter = { id: oid.toString() };
        expect(gql_1.Oid.createWhereClauseWith(filter)).toEqual({
            id: uuid
        });
    });
    test('A hash_id OID and a base64 hashid cant be registered fro the same scope', () => {
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope('BankAccount', 'ba');
        const t = () => gql_1.Oid.registerScope('BankAccount');
        expect(t).toThrow();
    });
    test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope('BankAccount', 'ba');
        const id = 500;
        const oid = gql_1.Oid.create('BankAccount', id);
        const filter = { id: oid.toString() };
        expect(gql_1.Oid.createWhereClauseWith(filter)).toEqual({
            id
        });
    });
    test('A hashid based Oid can be created with a numeric id, and reconstructed from a persistant value', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const PAYMENT_REQUEST_SHORT_CODE = 'pr';
        const OBJECT_ID1 = 1;
        gql_1.Oid.unregisterScopes();
        gql_1.Oid.registerScope(PAYMENT_REQUEST, PAYMENT_REQUEST_SHORT_CODE);
        const oid = gql_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString).toMatchInlineSnapshot(`"pr_ovjey"`);
        const newOid = new gql_1.Oid(oidAsString);
        expect(newOid).toEqual(oid);
    });
});
//# sourceMappingURL=oid.type.test.js.map