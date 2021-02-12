import { Oid } from '@rumbleship/oid';
/**
 * This probably should be refactored into a standalone package that system can use.
 *
 * For now, right here.
 */
export declare class NotFoundError extends Error {
}
export declare class InvalidOidError extends Error {
    constructor(oid: Oid, expected_scope: string);
}
