"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const types_1 = require("@rumbleship/types");
const uuid_1 = require("uuid");
const create_where_clause_with_1 = require("../../gql/create-where-clause-with");
test('That an oid can be reconstructed from a persisted value', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    types_1.Oid.unregisterScopes();
    types_1.Oid.registerScope(PAYMENT_REQUEST);
    const oid = types_1.Oid.create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
    const newOid = new types_1.Oid(oidAsString);
    expect(newOid).toEqual(oid);
});
test('An OID knows how to create a `{where: {} }` finder', () => {
    types_1.Oid.registerScope('BankAccount');
    const uuid = uuid_1.v4();
    const oid = types_1.Oid.create('BankAccount', uuid);
    const filter = { id: oid.toString() };
    expect(create_where_clause_with_1.createWhereClauseWith(filter)).toEqual({
        id: uuid
    });
});
test('A hash_id OID and a base64 hashid cant be registered fro the same scope', () => {
    types_1.Oid.unregisterScopes();
    types_1.Oid.registerScope('BankAccount', 'ba');
    const t = () => types_1.Oid.registerScope('BankAccount');
    expect(t).toThrow();
});
test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
    types_1.Oid.unregisterScopes();
    types_1.Oid.registerScope('BankAccount', 'ba');
    const id = 500;
    const oid = types_1.Oid.create('BankAccount', id);
    const filter = { id: oid.toString() };
    expect(create_where_clause_with_1.createWhereClauseWith(filter)).toEqual({
        id
    });
});
//# sourceMappingURL=create-where-clause-with.test.js.map