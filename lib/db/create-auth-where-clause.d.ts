import { Permissions, Authorizer, AuthorizerTreatAsMap } from '@rumbleship/acl';
import { Model } from 'sequelize-typescript';
import { ClassType } from '../helpers';
import { NodeService, NodeServiceOptions } from '../gql';
export interface AuthIncludeEntry {
    model: typeof Model;
    as: string;
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
export declare function createAuthWhereClause(permissions: Permissions, authorizer: Authorizer, targetClass: object, associationName?: string): {};
export interface AuthorizeContext<T extends NodeService<object>> {
    service: T;
    nodeServiceOptions?: NodeServiceOptions;
    authApplied?: boolean;
}
export declare const AuthorizeContextKey: unique symbol;
export declare function setAuthorizeContext<T extends NodeService<object>>(target: object, service: AuthorizeContext<T>): object;
export declare function getAuthorizeContext<T extends NodeService<object>>(target: object): AuthorizeContext<T>;
export {};
