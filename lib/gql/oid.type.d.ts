import { Model } from 'sequelize-typescript';
/**
 * Implements a globally unique persistent ID system. An Oid is created within the context of a
 * scope plus an identity within that scope. For example, under the scope 'BankAccount', each id
 * is the MySQL id used by sequelize to find a row.
 *
 */
export declare class Oid {
    oid: string;
    private static readonly scopes;
    private static ALPHABET;
    private static HASHID_MIN_LEN;
    private static HASHID_SALT;
    private static hashids;
    private static hashIdRegEx;
    static bankingHackTildeOptional: boolean;
    static alphaSalts: {
        User: string;
        Buyer: string;
        Supplier: string;
        Division: string;
        PurchaseOrder: string;
        Shipment: string;
    };
    constructor(oid: string);
    valueOf(): string;
    toString(): string;
    static registerScope(scope: string, shortCode?: string): number;
    static getKey(scope: string): string | number;
    static create(scope: string, id: string | number): Oid;
    static unregisterScopes(): void;
    static createWhereClauseWith<T extends Model<T>>(filter: any): any;
    unwrap(): {
        scope: string;
        id: string | number;
    };
}
