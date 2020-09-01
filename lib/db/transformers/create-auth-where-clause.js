"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorizeContext = exports.setAuthorizeContext = exports.AuthorizeContextKey = exports.createAuthWhereClause = exports.AuthorizeThrough = exports.addAuthorizeThrough = exports.getAuthorizeThroughEntries = exports.AUTHORIZE_THROUGH_ENTRIES = void 0;
const acl_1 = require("@rumbleship/acl");
const sequelize_1 = require("sequelize");
exports.AUTHORIZE_THROUGH_ENTRIES = Symbol('AUTHORIZE_THROUGH_ENTRIES');
class AuthThroughEntry {
    constructor(targetClass, propertyKey, associationName) {
        this.targetClass = targetClass;
        this.propertyKey = propertyKey;
        // tslint:disable-next-line: prettier
        this.associationName = associationName !== null && associationName !== void 0 ? associationName : propertyKey;
    }
}
function getAuthorizeThroughEntries(target) {
    var _a;
    return (_a = Reflect.getMetadata(exports.AUTHORIZE_THROUGH_ENTRIES, target)) !== null && _a !== void 0 ? _a : [];
}
exports.getAuthorizeThroughEntries = getAuthorizeThroughEntries;
function addAuthorizeThrough(target, authThroughEntry) {
    const authorizeThroughEntries = getAuthorizeThroughEntries(target);
    if (!authorizeThroughEntries.length) {
        Reflect.defineMetadata(exports.AUTHORIZE_THROUGH_ENTRIES, authorizeThroughEntries, target);
    }
    authorizeThroughEntries.push(authThroughEntry);
    return authorizeThroughEntries;
}
exports.addAuthorizeThrough = addAuthorizeThrough;
/**
 *
 * @param targetClass Decorator for defining an associated Relay object to use for finding the
 * authorization filter attrributes and Resources
 * @param associationName if the name of the property is NOT the name of the association, then can be overridden here
 */
function AuthorizeThrough(targetClass, associationName) {
    const decorator = (target, propertyKey) => {
        const authThroughEntry = new AuthThroughEntry(targetClass, propertyKey, associationName);
        addAuthorizeThrough(target, authThroughEntry);
    };
    return decorator;
}
exports.AuthorizeThrough = AuthorizeThrough;
function createAuthWhereClause(permissions, authorizer, action, targetClass, associationName) {
    const authorizingAttributes = acl_1.getAuthorizerTreatAs(targetClass, false);
    let whereAuthClause = {};
    for (const [role, keys] of authorizingAttributes) {
        const identifiersThatCan = authorizer.identifiersThatCan({
            action,
            matrix: permissions,
            only: role
        });
        if (identifiersThatCan.length) {
            for (const key of keys) {
                const whereKey = associationName ? `$${associationName.toString()}.${key}$` : key;
                whereAuthClause = {
                    [sequelize_1.Op.or]: [{ [whereKey]: { [sequelize_1.Op.in]: identifiersThatCan } }, whereAuthClause]
                };
            }
        }
    }
    return whereAuthClause;
}
exports.createAuthWhereClause = createAuthWhereClause;
exports.AuthorizeContextKey = '_@RumbleshipAuthorizeContextKey';
function setAuthorizeContext(findOptions, authorizeContext) {
    Reflect.set(findOptions, exports.AuthorizeContextKey, authorizeContext);
    return findOptions;
}
exports.setAuthorizeContext = setAuthorizeContext;
function getAuthorizeContext(target) {
    return Reflect.get(target, exports.AuthorizeContextKey);
}
exports.getAuthorizeContext = getAuthorizeContext;
//# sourceMappingURL=create-auth-where-clause.js.map