"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const uuid_1 = require("uuid");
const oid_1 = require("@rumbleship/oid");
const create_where_clause_with_1 = require("../../gql/create-where-clause-with");
describe('When the banking hack of tilde optional is set:', () => {
    test('That an Oid can be created from its part and then destructured.', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        oid_1.Oid.UnregisterScopes();
        oid_1.Oid.RegisterScope(PAYMENT_REQUEST);
        const oid = oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
        const { scope, id } = oid.unwrap();
        expect(scope).toBe(PAYMENT_REQUEST);
        expect(id).toBe(OBJECT_ID1);
    });
    test('That an Oid cannot be created without the scope being registered first', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        oid_1.Oid.UnregisterScopes();
        const t = () => {
            oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
        };
        expect(t).toThrow();
    });
    test('That an oid can be reconstructed from a persisted value created with the ~ prefex', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        oid_1.Oid.UnregisterScopes();
        oid_1.Oid.RegisterScope(PAYMENT_REQUEST);
        const oid = oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
        const newOid = new oid_1.Oid(oidAsString);
        expect(newOid).toEqual(oid);
    });
    test('That an oid can be reconstructed from a persisted value without a prefix', () => {
        const PAYMENT_REQUEST = 'PaymentRequest';
        const OBJECT_ID1 = '0001';
        oid_1.Oid.UnregisterScopes();
        oid_1.Oid.RegisterScope(PAYMENT_REQUEST);
        const oid = oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
        const oidAsString = oid.toString();
        expect(oidAsString[0]).toBe('~');
        const newOid = new oid_1.Oid(oidAsString.substring(1));
        expect(newOid.unwrap()).toEqual(oid.unwrap());
    });
    test('An OID knows how to create a `{where: {} }` finder both with a tilde and without', () => {
        oid_1.Oid.RegisterScope('BankAccount');
        const uuid = uuid_1.v4();
        const oid = oid_1.Oid.Create('BankAccount', uuid);
        const filter = { id: oid.toString() };
        expect(create_where_clause_with_1.createWhereClauseWith(filter)).toEqual({
            id: uuid
        });
        const filterNoTilde = { id: oid.toString().substring(1) };
        expect(create_where_clause_with_1.createWhereClauseWith(filterNoTilde)).toEqual({
            id: uuid
        });
    });
});
//# sourceMappingURL=oid.bankinghack.type.test.js.map