import { Permissions, Authorizer, Actions, getAuthorizerTreatAs } from '@rumbleship/acl';
import { Op, WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../../helpers';

export interface AuthIncludeEntry {
  model: typeof Model;
  as: string;
  attributes?: string[];
}

export const AUTHORIZE_THROUGH_ENTRIES = Symbol('AUTHORIZE_THROUGH_ENTRIES');

class AuthThroughEntry {
  associationName: string | symbol;
  constructor(
    public readonly targetClass: () => ClassType<Record<string, any>>,
    public readonly propertyKey: string | symbol,
    associationName?: string
  ) {
    // tslint:disable-next-line: prettier
    this.associationName = associationName ?? propertyKey;
  }
}
export function getAuthorizeThroughEntries(target: Record<string, any>): AuthThroughEntry[] {
  return Reflect.getMetadata(AUTHORIZE_THROUGH_ENTRIES, target) ?? [];
}

export function addAuthorizeThrough(
  target: Record<string, any>,
  authThroughEntry: AuthThroughEntry
): AuthThroughEntry[] {
  const authorizeThroughEntries = getAuthorizeThroughEntries(target);
  if (!authorizeThroughEntries.length) {
    Reflect.defineMetadata(AUTHORIZE_THROUGH_ENTRIES, authorizeThroughEntries, target);
  }
  authorizeThroughEntries.push(authThroughEntry);
  return authorizeThroughEntries;
}
/**
 *
 * @param targetClass Decorator for defining an associated Relay object to use for finding the
 * authorization filter attrributes and Resources
 * @param associationName if the name of the property is NOT the name of the association, then can be overridden here
 */
export function AuthorizeThrough(
  targetClass: () => ClassType<Record<string, any>>,
  associationName?: string
): PropertyDecorator {
  const decorator: PropertyDecorator = (
    target: Record<string, any>,
    propertyKey: string | symbol
  ) => {
    const authThroughEntry = new AuthThroughEntry(targetClass, propertyKey, associationName);
    addAuthorizeThrough(target, authThroughEntry);
  };
  return decorator;
}

export function createAuthWhereClause(
  permissions: Permissions,
  authorizer: Authorizer,
  action: Actions,
  targetClass: Record<string, any>,
  associationName?: string
): WhereOptions {
  const authorizingAttributes = getAuthorizerTreatAs(targetClass, false);
  let whereAuthClause = {};

  for (const [role, keys] of authorizingAttributes) {
    const identifiersThatCan = authorizer.identifiersThatCan({
      action,
      matrix: permissions,
      only: role
    });
    if (identifiersThatCan.length) {
      for (const key of keys) {
        const whereKey = associationName ? `$${associationName}.${key}$` : key;
        whereAuthClause = {
          [Op.or]: [{ [whereKey]: { [Op.in]: identifiersThatCan } }, whereAuthClause]
        };
      }
    }
  }

  return whereAuthClause;
}

/**
 * Holds the information needed to calculate the
 * additional where clause to ensure that the current authorized user
 * only retrieves rows they are allowed to
 */
export interface AuthorizeContext {
  authApplied?: boolean;
}

export const AuthorizeContextKey = '_@RumbleshipAuthorizeContextKey';
export function setAuthorizeContext(
  findOptions: Record<string, any>,
  authorizeContext: AuthorizeContext
): Record<string, any> {
  Reflect.set(findOptions, AuthorizeContextKey, authorizeContext);
  return findOptions;
}
export function getAuthorizeContext(target: Record<string, any>): AuthorizeContext {
  return Reflect.get(target, AuthorizeContextKey);
}
