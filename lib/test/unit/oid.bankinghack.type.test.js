"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const uuid_1 = require("uuid");
const index_1 = require("../../gql/index");
index_1.Oid.bankingHackTildeOptional = true;
describe('When the banking hack of tilde optional is set:', () => {
    test('That an Oid can be created from its part and then destructured.', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        index_1.Oid.unregisterScopes();
        index_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = index_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const { scope, id } = oid.unwrap();
        expect(scope).toBe(PAYMENT_REQUEST);
        expect(id).toBe(OBJECT_ID1);
    });
    test('That an Oid cannot be created without the scope being registered first', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        index_1.Oid.unregisterScopes();
        const t = () => {
            index_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        };
        expect(t).toThrow();
    });
    test('That an oid can be reconstructed from a persisted value created with the ~ prefex', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        index_1.Oid.unregisterScopes();
        index_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = index_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
        const newOid = new index_1.Oid(oidAsString);
        expect(newOid).toEqual(oid);
    });
    test('That an oid can be reconstructed from a persisted value without a prefix', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        index_1.Oid.unregisterScopes();
        index_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = index_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString[0]).toBe('~');
        const newOid = new index_1.Oid(oidAsString.substring(1));
        expect(newOid.unwrap()).toEqual(oid.unwrap());
    });
    test('That when the hack is set to false, the oid cannot be reconstructed from a persisted value without a prefix', () => {
        index_1.Oid.bankingHackTildeOptional = false;
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        index_1.Oid.unregisterScopes();
        index_1.Oid.registerScope(PAYMENT_REQUEST);
        const oid = index_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString[0]).toBe('~');
        const newOid = new index_1.Oid(oidAsString.substring(1));
        expect(() => newOid.unwrap()).toThrow();
        index_1.Oid.bankingHackTildeOptional = true;
    });
    test('An OID knows how to create a `{where: {} }` finder both with a tilde and without', () => {
        index_1.Oid.registerScope('BankAccount');
        const uuid = uuid_1.v4();
        const oid = index_1.Oid.create('BankAccount', uuid);
        const filter = { id: oid.toString() };
        expect(index_1.Oid.createWhereClauseWith(filter)).toEqual({
            id: uuid
        });
        const filterNoTilde = { id: oid.toString().substring(1) };
        expect(index_1.Oid.createWhereClauseWith(filterNoTilde)).toEqual({
            id: uuid
        });
    });
});
//# sourceMappingURL=oid.bankinghack.type.test.js.map