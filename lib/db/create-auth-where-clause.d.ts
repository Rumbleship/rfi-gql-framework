import { Permissions, Authorizer, AuthorizerTreatAsMap, Actions } from '@rumbleship/acl';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers';
export interface AuthIncludeEntry {
    model: typeof Model;
    as: string;
    attributes?: string[];
}
export declare function getAuthorizerTreatAsNoDefault(authorizable: any): AuthorizerTreatAsMap;
export declare const AUTHORIZE_THROUGH_ENTRIES: unique symbol;
declare class AuthThroughEntry {
    readonly targetClass: () => ClassType<object>;
    readonly propertyKey: string;
    associationName: string;
    constructor(targetClass: () => ClassType<object>, propertyKey: string, associationName?: string);
}
export declare function getAuthorizeThroughEntries(target: object): AuthThroughEntry[];
export declare function addAuthorizeThrough(target: object, authThroughEntry: AuthThroughEntry): AuthThroughEntry[];
/**
 *
 * @param targetClass Decorator for defining an associated Relay object to use for finding the
 * authorization filter attrributes and Resources
 * @param associationName if the name of the property is NOT the name of the association, then can be overridden here
 */
export declare function AuthorizeThrough(targetClass: () => ClassType<object>, associationName?: string): (target: object, propertyKey: string) => void;
export declare function createAuthWhereClause(permissions: Permissions, authorizer: Authorizer, action: Actions, targetClass: object, associationName?: string): {};
/**
 * Holds the information needed to calculate the
 * additional where clause to ensure that the current authorized user
 * only retrieves rows they are allowed to
 */
export interface AuthorizeContext {
    authApplied?: boolean;
}
export declare const AuthorizeContextKey = "_@RumbleshipAuthorizeContextKey";
export declare function setAuthorizeContext(findOptions: object, authorizeContext: AuthorizeContext): object;
export declare function getAuthorizeContext(target: object): AuthorizeContext;
export {};
