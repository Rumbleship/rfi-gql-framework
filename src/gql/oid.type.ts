import * as xxhash from 'xxhash';

import { Model } from 'sequelize-typescript';
import { toBase64, fromBase64 } from '../helpers/base64';

class Scopes {
  private table: string[];
  constructor() {
    this.table = [];
  }

  hash(toHash: string) {
    return xxhash.hash(Buffer.from(toHash), 0xcafecafe);
  }
  addScope(plaintextScopeName: string): number {
    const pos = this.hash(plaintextScopeName);
    if (this.scope(pos)) {
      throw new Error(
        `Scope for OID can only be added once: ` +
          plaintextScopeName +
          `Duplicate name or hash clash`
      );
    }
    this.table[pos] = plaintextScopeName;
    return pos;
  }

  scope(key: number) {
    return this.table[key];
  }
  getKey(plaintextScopeName: string) {
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
export class Oid {
  private static readonly scopes: Scopes = new Scopes();
  constructor(readonly oid: string) {}

  // Overide Object.valueOf so that the GraphQL ID type can convert to the 'primitive' type. In this case a
  // string.
  valueOf() {
    return this.oid;
  }

  toString() {
    return this.oid;
  }

  static registerScope(scope: string): number {
    return Oid.scopes.addScope(scope);
  }
  static getKey(scope: string): number {
    return Oid.scopes.getKey(scope);
  }

  static create(scope: string | number, id: string): Oid {
    const key: number = typeof scope === 'string' ? Oid.scopes.getKey(scope) : scope;
    const oid_json = JSON.stringify({ key, id });
    return new Oid(toBase64(oid_json));
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

  unwrap(): { scope: string; id: string } {
    const plain = fromBase64(this.oid);
    try {
      const { key, id } = JSON.parse(plain);

      const scope = Oid.scopes.scope(key);
      return { scope, id };
    } catch (e) {
      throw new Error('Invalid Object ID');
    }
  }
}
