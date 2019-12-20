import {
  Permissions,
  Authorizer,
  AuthorizerTreatAsMap,
  AuthResourceSymbol,
  Actions
} from '@rumbleship/acl';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers';
import { Op } from 'sequelize';

import { NodeService, NodeServiceOptions } from '../gql';

export interface AuthIncludeEntry {
  model: typeof Model;
  as: string;
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
  targetClass: object,
  associationName?: string
) {
  const authorizingAttributes = getAuthorizerTreatAsNoDefault(targetClass);
  let whereAuthClause = {};

  for (const [role, keys] of authorizingAttributes) {
    const setOfIds = authorizer.identifiersThatCan({
      action: Actions.QUERY,
      matrix: permissions,
      only: role
    });
    if (setOfIds.length) {
      for (const key of keys) {
        const whereKey = associationName ? `$${associationName}.${key}$` : key;
        whereAuthClause = { [Op.or]: [{ [whereKey]: { [Op.in]: setOfIds } }, whereAuthClause] };
      }
    }
  }

  return whereAuthClause;
}

export interface AuthorizeContext<T extends NodeService<object>> {
  service: T;
  nodeServiceOptions?: NodeServiceOptions;
  authApplied?: boolean;
}

export const AuthorizeContextKey = Symbol('AuthorizeContextKey');
export function setAuthorizeContext<T extends NodeService<object>>(
  target: object,
  service: AuthorizeContext<T>
) {
  Reflect.set(target, AuthorizeContextKey, service);
  return target;
}
export function getAuthorizeContext<T extends NodeService<object>>(
  target: object
): AuthorizeContext<T> {
  return Reflect.get(target, AuthorizeContextKey);
}
