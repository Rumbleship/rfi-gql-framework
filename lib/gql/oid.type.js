"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xxhash = require("xxhash");
const base64_1 = require("../helpers/base64");
const hashids_1 = require("hashids");
// Oid supports both base64 encoded representation (as per UUID based Oids in Banking) and
// hash_ids as per the rest of the system.
//
// hash_ids are generally easier to consume and deal with when a human needs to write it down
// although there is discussion of whether these make the ID more leaky.
//
// hash_id's leak the adjacency of database id's as opposed to uuid based Oid's which leak
// the id, but its pretty hard to guess the ones either side of it... or even any other one in
// the database
//
// hash_id's look like this:-
// ~po_34dfr
// the `~` indicates it is a hash_id the letters before the `_` are the short code for the type of entity.
// It's the organizations responsibility to make sure we dont clash
//
// `~` is not used for base64 encoding and don't have a reserved purpose in a URI.
//
// TO USE a hashID encoding, simply add the short code for that type when calling Oid.registerScope()
// Omitting the short code defaults to a base64 encoded scheme.
//
// see :- https://hashids.org/javascript/
class Scopes {
    constructor() {
        this.table = new Map();
    }
    hash(toHash) {
        return xxhash.hash(Buffer.from(toHash), 0xcafecafe);
    }
    addScope(plaintextScopeName, shortCode) {
        if (this.findKey(plaintextScopeName)) {
            throw new Error(`Scope for OID can only be added once: 
          ${plaintextScopeName}: Duplicate name`);
        }
        const pos = shortCode ? shortCode : this.hash(plaintextScopeName);
        if (this.scope(pos)) {
            throw new Error(`Scope for OID can only be added once: 
          ${plaintextScopeName}-${shortCode ? shortCode : ''}
          hash or short code clash`);
        }
        this.table.set(pos, plaintextScopeName);
        return pos;
    }
    scope(key) {
        return this.table.get(key);
    }
    findKey(plaintextScopeName) {
        for (const aKey of this.table.keys()) {
            if (this.scope(aKey) === plaintextScopeName) {
                return aKey;
            }
        }
        return null;
    }
    getKey(plaintextScopeName) {
        const key = this.findKey(plaintextScopeName);
        if (key) {
            return key;
        }
        throw new Error('Scope:' + plaintextScopeName + ' has not been added');
    }
    resetScopes() {
        this.table = new Map();
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
    static registerScope(scope, shortCode) {
        return Oid.scopes.addScope(scope, shortCode);
    }
    static getKey(scope) {
        return Oid.scopes.getKey(scope);
    }
    static create(scope, id) {
        const key = Oid.scopes.getKey(scope);
        if (typeof key === 'number') {
            // base64 encoded
            const oid_json = JSON.stringify({ key, id });
            return new Oid(base64_1.toBase64(oid_json));
        }
        else {
            // hashid
            if (typeof id === 'number') {
                return new Oid(`~${key}_${this.hashids.encode(id)}`);
            }
            else {
                throw Error(`Hash_id Oids MUST have a database id of type number. Check the Oid.registerScope for : ${scope}`);
            }
        }
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
        let scope;
        let anId;
        if (this.oid[0] !== '~') {
            const plain = base64_1.fromBase64(this.oid);
            try {
                const { key, id } = JSON.parse(plain);
                anId = id;
                scope = Oid.scopes.scope(key);
            }
            catch (e) {
                throw new Error('Invalid Object ID');
            }
        }
        else {
            const matches = Oid.hashIdRegEx.exec(this.oid);
            if (matches && matches.length === 4) {
                scope = Oid.scopes.scope(matches[2]);
                anId = Oid.hashids.decode(matches[3])[0];
            }
            else {
                throw Error(`Invalid oid format: ${this.oid}`);
            }
        }
        if (scope && anId) {
            return { scope, id: anId };
        }
        else {
            throw Error(`Malformed oid format: ${this.oid}`);
        }
    }
}
Oid.scopes = new Scopes();
// For hashids
Oid.ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
Oid.HASHID_MIN_LEN = 5;
// as hashids are NOT meant to be secure, we add a salt just to increase the uniqueness
Oid.HASHID_SALT = 'rfi_oid';
Oid.hashids = new hashids_1.default(Oid.HASHID_SALT, Oid.HASHID_MIN_LEN, Oid.ALPHABET);
Oid.hashIdRegEx = /^(~)(.+)_([a-z0-9]+)/;
exports.Oid = Oid;
//# sourceMappingURL=oid.type.js.map