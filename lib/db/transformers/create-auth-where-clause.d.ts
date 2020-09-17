import { Permissions, Authorizer, Actions, AuthorizerTreatAsMap } from '@rumbleship/acl';
import { WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../../helpers';
export interface AuthIncludeEntry {
    model: typeof Model;
    as: string;
    attributes?: string[];
}
export declare const AUTHORIZE_THROUGH_ENTRIES: unique symbol;
export declare class AuthThroughEntry {
    readonly targetClass: () => ClassType<Record<string, any>>;
    readonly propertyKey: string | symbol;
    associationName: string | symbol;
    constructor(targetClass: () => ClassType<Record<string, any>>, propertyKey: string | symbol, associationName?: string);
}
export declare function getAuthorizeThroughEntries(target: Record<string, any>): AuthThroughEntry[];
export declare function addAuthorizeThrough(target: Record<string, any>, authThroughEntry: AuthThroughEntry): AuthThroughEntry[];
/**
 *
 * @param targetClass Decorator for defining an associated Relay object to use for finding the
 * authorization filter attrributes and Resources
 * @param associationName if the name of the property is NOT the name of the association, then can be overridden here
 */
export declare function AuthorizeThrough(targetClass: () => ClassType<Record<string, any>>, associationName?: string): PropertyDecorator;
export declare function createAuthWhereClause(permissions: Permissions, authorizer: Authorizer, action: Actions, authorizingAttributes: AuthorizerTreatAsMap, associationName?: string | symbol): WhereOptions;
/**
 * Holds the information needed to calculate the
 * additional where clause to ensure that the current authorized user
 * only retrieves rows they are allowed to
 */
export interface AuthorizeContext {
    authApplied?: boolean;
}
export declare const AuthorizeContextKey = "_@RumbleshipAuthorizeContextKey";
export declare function setAuthorizeContext(findOptions: Record<string, any>, authorizeContext: AuthorizeContext): Record<string, any>;
export declare function getAuthorizeContext(target: Record<string, any>): AuthorizeContext;
export declare function mergeAuthorizerTreatAsMaps(map1: AuthorizerTreatAsMap, map2: AuthorizerTreatAsMap): AuthorizerTreatAsMap;
export declare function cloneAuthorizerTreatAsMap(map: AuthorizerTreatAsMap): AuthorizerTreatAsMap;
