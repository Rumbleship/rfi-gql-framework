import * as xxhash from 'xxhash';

import { Model } from 'sequelize-typescript';
import { toBase64, fromBase64 } from '../helpers/base64';
import Hashids from 'hashids';

// Oid supports both base64 encoded representation (as per UUID based Oids in Banking) and
// hash_ids as per the rest of the system.
//
// The strategy used is set via
//
// hash_ids are generally easier to consume and deal with when a human needs to write it down
// although there is discussion of whether these make the ID more leaky:
//
// hash_id's leak the adjacency of database id's as opposed to uuid based Oid's which leak
// the id, but its pretty hard to guess the ones either side of it... or even any other one in
// the database
//
// hash_id's look like this:-
// po_34dfr
//
// see :- https://hashids.org/javascript/
//
//
// base64 encoded UUID based oids are prefixed by a ~.
//
// TO USE a hashID encoding, simply add the short code for that type when calling Oid.registerScope()
// Omitting the short code defaults to a base64 encoded scheme.
//
// NOTE: BIG Hack... to ease transition of banking oids to have the ~ prefix, the Oid class has the static
// boolean member bankingHackTildeOptional which is set in banking. THis MUST be removed once the migration is complete
//

class Scopes {
  private table: Map<string | number, string>;
  constructor() {
    this.table = new Map<string | number, string>();
  }

  hash(toHash: string) {
    return xxhash.hash(Buffer.from(toHash), 0xcafecafe);
  }
  addScope(plaintextScopeName: string, shortCode?: string): number | number {
    if (this.findKey(plaintextScopeName)) {
      throw new Error(
        `Scope for OID can only be added once: 
          ${plaintextScopeName}: Duplicate name`
      );
    }
    const pos = shortCode ? shortCode : this.hash(plaintextScopeName);
    if (this.scope(pos)) {
      throw new Error(
        `Scope for OID can only be added once: 
          ${plaintextScopeName}-${shortCode ? shortCode : ''}
          hash or short code clash`
      );
    }
    this.table.set(pos, plaintextScopeName);
    return pos;
  }

  scope(key: number | string): string | undefined {
    return this.table.get(key);
  }

  findKey(plaintextScopeName: string) {
    for (const aKey of this.table.keys()) {
      if (this.scope(aKey) === plaintextScopeName) {
        return aKey;
      }
    }
    return null;
  }
  getKey(plaintextScopeName: string) {
    const key = this.findKey(plaintextScopeName);
    if (key) {
      return key;
    }
    throw new Error('Scope:' + plaintextScopeName + ' has not been added');
  }
  resetScopes() {
    this.table = new Map<string | number, string>();
  }
}

/**
 * Implements a globally unique persistent ID system. An Oid is created within the context of a
 * scope plus an identity within that scope. For example, under the scope 'BankAccount', each id
 * is the MySQL id used by sequelize to find a row.
 *
 */

export class Oid {
  private static readonly scopes: Scopes = new Scopes();
  // For hashids
  private static ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
  private static HASHID_MIN_LEN = 5;
  // as hashids are NOT meant to be secure, we add a salt just to increase the uniqueness
  private static HASHID_SALT = 'rfi_oid';
  private static hashids = new Hashids(Oid.HASHID_SALT, Oid.HASHID_MIN_LEN, Oid.ALPHABET);
  private static hashIdRegEx = /^(.+)_([a-z0-9]+)/;
  public static bankingHackTildeOptional: boolean = false;
  public static alphaSalts = {
    User: 'User',
    Buyer: 'Division',
    Supplier: 'Division',
    Division: 'Division',
    PurchaseOrder: 'purchaseOrder',
    Shipment: 'shipment'
  };
  constructor(public oid: string) {}

  // Overide Object.valueOf so that the GraphQL ID type can convert to the 'primitive' type. In this case a
  // string.
  valueOf() {
    return this.oid;
  }

  toString() {
    return this.oid;
  }

  static registerScope(scope: string, shortCode?: string): number {
    return Oid.scopes.addScope(scope, shortCode);
  }
  static getKey(scope: string): string | number {
    return Oid.scopes.getKey(scope);
  }

  static create(scope: string, id: string | number): Oid {
    const key = Oid.scopes.getKey(scope);
    if (typeof key === 'number') {
      // base64 encoded
      const oid_json = JSON.stringify({ key, id });
      return new Oid(`~${toBase64(oid_json)}`);
    } else {
      // hashid
      if (typeof id === 'number') {
        return new Oid(`${key}_${this.hashids.encode(id)}`);
      } else {
        throw Error(
          `Hash_id Oids MUST have a database id of type number. Check the Oid.registerScope for : ${scope}`
        );
      }
    }
  }

  static unregisterScopes() {
    Oid.scopes.resetScopes();
  }

  static createWhereClauseWith<T extends Model<T>>(filter: any): any {
    if (filter.id) {
      const oid = new Oid(filter.id);
      const { id: databaseId } = oid.unwrap();
      delete filter.id;
      Reflect.set(filter, 'id', databaseId);
    }
    return filter;
  }

  unwrap(): { scope: string; id: string | number } {
    let scope: string | undefined;
    let anId: string | number;

    if (Oid.bankingHackTildeOptional) {
      // this is only set in banking while banking is transitioning the Oids to ~pre-fix
      // SO We KNOW that is is safe todo
      if (this.oid[0] !== '~') {
        this.oid = '~' + this.oid.toString();
      }
    }
    if (this.oid[0] === '~') {
      const plain = fromBase64(this.oid.substring(1));
      try {
        const { key, id } = JSON.parse(plain);
        anId = id;
        scope = Oid.scopes.scope(key);
      } catch (e) {
        throw new Error('Invalid Object ID');
      }
    } else {
      const matches = Oid.hashIdRegEx.exec(this.oid);
      if (matches && matches.length === 3) {
        scope = Oid.scopes.scope(matches[1]);
        const decoder =
          scope && Object.keys(Oid.alphaSalts).includes(scope)
            ? new Hashids(Reflect.get(Oid.alphaSalts, scope), Oid.HASHID_MIN_LEN, Oid.ALPHABET)
            : Oid.hashids;

        anId = decoder.decode(matches[2])[0];
      } else {
        throw Error(`Invalid oid format: ${this.oid}`);
      }
    }
    if (scope && anId) {
      return { scope, id: anId };
    } else {
      throw Error(`Malformed oid format: ${this.oid}`);
    }
  }
}
