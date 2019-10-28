"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const oid_1 = require("@rumbleship/oid");
const uuid_1 = require("uuid");
const create_where_clause_with_1 = require("../../gql/create-where-clause-with");
test('That an oid can be reconstructed from a persisted value', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = '0001';
    const oid = oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString).toMatchInlineSnapshot(`"~eyJrZXkiOjU1ODQ1OTI2MiwiaWQiOiIwMDAxIn0="`);
    const newOid = new oid_1.Oid(oidAsString);
    expect(newOid).toEqual(oid);
});
test('An OID knows how to create a `{where: {} }` finder', () => {
    const uuid = uuid_1.v4();
    const oid = oid_1.Oid.Create('BankAccount', uuid);
    const filter = { id: oid.toString() };
    expect(create_where_clause_with_1.createWhereClauseWith(filter)).toEqual({
        id: uuid
    });
});
test('A hash_id OID knows how to create a `{where: {} }` finder', () => {
    const id = 500;
    const oid = oid_1.Oid.Create('BankAccount', id);
    const filter = { id: oid.toString() };
    expect(create_where_clause_with_1.createWhereClauseWith(filter)).toEqual({
        id
    });
});
//# sourceMappingURL=create-where-clause-with.test.js.map