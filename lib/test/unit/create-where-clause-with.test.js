"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const oid_1 = require("@rumbleship/oid");
const create_where_clause_with_1 = require("../../gql/create-where-clause-with");
test('That an oid can be reconstructed from a persisted value', () => {
    const PAYMENT_REQUEST = 'PaymentRequest';
    const OBJECT_ID1 = 1;
    const oid = oid_1.Oid.Create(PAYMENT_REQUEST, OBJECT_ID1);
    const oidAsString = oid.toString();
    expect(oidAsString).toMatchInlineSnapshot(`"pr_ovjey6d"`);
    const newOid = new oid_1.Oid(oidAsString);
    expect(newOid).toEqual(oid);
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