"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xxhash = require("xxhash");
const base64_1 = require("../helpers/base64");
class Scopes {
    constructor() {
        this.table = [];
    }
    hash(toHash) {
        return xxhash.hash(Buffer.from(toHash), 0xcafecafe);
    }
    addScope(plaintextScopeName) {
        const pos = this.hash(plaintextScopeName);
        if (this.scope(pos)) {
            throw new Error(`Scope for OID can only be added once: ` +
                plaintextScopeName +
                `Duplicate name or hash clash`);
        }
        this.table[pos] = plaintextScopeName;
        return pos;
    }
    scope(key) {
        return this.table[key];
    }
    getKey(plaintextScopeName) {
        const key = this.hash(plaintextScopeName);
        if (!this.scope(key)) {
            throw new Error('Scope:' + plaintextScopeName + ' has not been added');
        }
        return key;
    }
    resetScopes() {
        this.table.length = 0;
    }
}
/**
 * Implements a globally unique persistent ID system. An Oid is created within the context of a
 * scope plus an identity within that scope. For example, under the scope 'BankAccount', each id
 * is the MySQL id used by sequelize to find a row.
 *
 */
class Oid {
    constructor(oid) {
        this.oid = oid;
    }
    // Overide Object.valueOf so that the GraphQL ID type can convert to the 'primitive' type. In this case a
    // string.
    valueOf() {
        return this.oid;
    }
    toString() {
        return this.oid;
    }
    static registerScope(scope) {
        return Oid.scopes.addScope(scope);
    }
    static getKey(scope) {
        return Oid.scopes.getKey(scope);
    }
    static create(scope, id) {
        const key = typeof scope === 'string' ? Oid.scopes.getKey(scope) : scope;
        const oid_json = JSON.stringify({ key, id });
        return new Oid(base64_1.toBase64(oid_json));
    }
    static unregisterScopes() {
        Oid.scopes.resetScopes();
    }
    static createWhereClauseWith(filter) {
        if (filter.id) {
            const oid = new Oid(filter.id);
            const { id: databaseId } = oid.unwrap();
            delete filter.id;
            Reflect.set(filter, 'id', databaseId);
        }
        return filter;
    }
    unwrap() {
        const plain = base64_1.fromBase64(this.oid);
        try {
            const { key, id } = JSON.parse(plain);
            const scope = Oid.scopes.scope(key);
            return { scope, id };
        }
        catch (e) {
            throw new Error('Invalid Object ID');
        }
    }
}
Oid.scopes = new Scopes();
exports.Oid = Oid;
//# sourceMappingURL=oid.type.js.map