import {
  Permissions,
  Authorizer,
  AuthorizerTreatAsMap,
  AuthResourceSymbol,
  Actions
} from '@rumbleship/acl';
import { Op } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../../helpers';

export interface AuthIncludeEntry {
  model: typeof Model;
  as: string;
  attributes?: string[];
}

export function getAuthorizerTreatAsNoDefault(authorizable: any): AuthorizerTreatAsMap {
  const retrieved: AuthorizerTreatAsMap = Reflect.getMetadata(AuthResourceSymbol, authorizable);
  const treatAsMap = retrieved || new AuthorizerTreatAsMap();

  return treatAsMap;
}

export const AUTHORIZE_THROUGH_ENTRIES = Symbol('AUTHORIZE_THROUGH_ENTRIES');

class AuthThroughEntry {
  associationName: string;
  constructor(
    public readonly targetClass: () => ClassType<object>,
    public readonly propertyKey: string,
    associationName?: string
  ) {
    // tslint:disable-next-line: prettier
    this.associationName = associationName ?? propertyKey;
  }
}
export function getAuthorizeThroughEntries(target: object): AuthThroughEntry[] {
  return Reflect.getMetadata(AUTHORIZE_THROUGH_ENTRIES, target) ?? [];
}

export function addAuthorizeThrough(
  target: object,
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
export function AuthorizeThrough(targetClass: () => ClassType<object>, associationName?: string) {
  return (target: object, propertyKey: string) => {
    const authThroughEntry = new AuthThroughEntry(targetClass, propertyKey, associationName);
    addAuthorizeThrough(target, authThroughEntry);
    return;
  };
}

export function createAuthWhereClause(
  permissions: Permissions,
  authorizer: Authorizer,
  action: Actions,
  targetClass: object,
  associationName?: string
) {
  const authorizingAttributes = getAuthorizerTreatAsNoDefault(targetClass);
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
export function setAuthorizeContext(findOptions: object, authorizeContext: AuthorizeContext) {
  Reflect.set(findOptions, AuthorizeContextKey, authorizeContext);
  return findOptions;
}
export function getAuthorizeContext(target: object): AuthorizeContext {
  return Reflect.get(target, AuthorizeContextKey);
}
