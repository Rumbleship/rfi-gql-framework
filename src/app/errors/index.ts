import { Oid } from '@rumbleship/oid';

/**
 * This probably should be refactored into a standalone package that system can use.
 *
 * For now, right here.
 */
export class NotFoundError extends Error {}

export class InvalidOidError extends Error {
  constructor(oid: Oid, expected_scope: string) {
    super(`Invalid oid: ${oid.toString()} does not match ${expected_scope}`);
  }
}
