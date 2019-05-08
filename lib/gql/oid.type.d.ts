import { Model } from 'sequelize-typescript';
/**
 * Implements a globally unique persistent ID system. An Oid is created within the context of a
 * scope plus an identity within that scope. For example, under the scope 'BankAccount', each id
 * is the MySQL id used by sequelize to find a row.
 *
 */
export declare class Oid {
    readonly oid: string;
    private static readonly scopes;
    constructor(oid: string);
    valueOf(): string;
    toString(): string;
    static registerScope(scope: string): number;
    static getKey(scope: string): number;
    static create(scope: string | number, id: string): Oid;
    static unregisterScopes(): void;
    static createWhereClauseWith<T extends Model<T>>(filter: any): any;
    unwrap(): {
        scope: string;
        id: string;
    };
}
