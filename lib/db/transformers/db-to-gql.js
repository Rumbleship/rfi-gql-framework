"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gqlToDb = exports.reloadNodeFromModel = exports.dbToGql = exports.GqlSingleTableInheritanceFactory = void 0;
const oid_1 = require("@rumbleship/oid");
const create_auth_where_clause_1 = require("./create-auth-where-clause");
const db_to_gql_symbol_1 = require("./db-to-gql.symbol");
/**
 * Defines a simple interface to create a concrete class from a discriminator
 * These should be added to 'NodeServices' on the context as well... and use the base classes
 * service implementation
 *
 * Note that the base class is used for the 'scope' of the oid.
 */
class GqlSingleTableInheritanceFactory {
    constructor(oidScope, // the scope is the base class scope.
    discriminatorKey, concreteClassMap) {
        this.oidScope = oidScope;
        this.discriminatorKey = discriminatorKey;
        this.concreteClassMap = concreteClassMap;
    }
    makeFrom(from, nodeService) {
        const discriminator = Reflect.get(from, this.discriminatorKey);
        if (discriminator) {
            const concreteClass = this.concreteClassMap.get(discriminator);
            if (concreteClass) {
                return dbToGql(nodeService, concreteClass(), from, this.oidScope);
            }
        }
        throw Error(`couldnt find concrete class for: ${discriminator}`);
    }
    getClassFor(discriminator) {
        return this.concreteClassMap.get(discriminator);
    }
    getClasses() {
        return [...this.concreteClassMap.values()].map((concreteFn) => concreteFn());
    }
}
exports.GqlSingleTableInheritanceFactory = GqlSingleTableInheritanceFactory;
/**
 * @deprecated for direct use. Use SequelizeBaseServiceInterface.gqlFromDbModel
 * instead.
 *
 * Transforms from a sequelize model to a gql object
 * THis does not take into account any polymorthic discriminators
 * and so should not be used directly.
 *
 * Note that if any models are eager loaded, they ARE not converted, so the Relay/gql object
 * references the sequelize model of that name... higher level functions should deal with that
 * by checkingthe instanceOf the associated model and converting at that time as required.
 *
 * @param nodeService
 * @param to
 * @param from
 * @param oidScope
 */
function dbToGql(nodeService, to, from, oidScope) {
    const modelAsPlain = from.get( /*{ plain: true }*/);
    // Have we already done this transforation?
    if (db_to_gql_symbol_1.apiKey in from) {
        return Reflect.get(from, db_to_gql_symbol_1.apiKey);
    }
    const target = new to();
    target._service = nodeService;
    // tslint:disable-next-line: prefer-object-spread
    const obj = Object.assign(target, modelAsPlain);
    const oid = oid_1.Oid.Create(oidScope ? oidScope : obj.constructor['name'], modelAsPlain.id);
    obj.id = oid;
    // store for future use
    Reflect.set(obj, db_to_gql_symbol_1.modelKey, from);
    Reflect.set(from, db_to_gql_symbol_1.apiKey, obj);
    return obj;
}
exports.dbToGql = dbToGql;
async function reloadNodeFromModel(node, fromDb = true) {
    if (db_to_gql_symbol_1.modelKey in node) {
        const model = Reflect.get(node, db_to_gql_symbol_1.modelKey);
        if (fromDb) {
            // We know we are auth'd at this point, so simply add an blank auth context so the sequelize Find methods will
            // know that we have explicitly considered authorization
            const reloadOpts = create_auth_where_clause_1.setAuthorizeContext({}, { authApplied: true });
            await model.reload(reloadOpts);
        }
        const modelAsPlain = model.get({ plain: true, clone: true });
        delete modelAsPlain.id;
        Object.assign(node, modelAsPlain);
    }
    return node;
}
exports.reloadNodeFromModel = reloadNodeFromModel;
function gqlToDb(node) {
    if (db_to_gql_symbol_1.modelKey in node) {
        return Reflect.get(node, db_to_gql_symbol_1.modelKey);
    }
    throw new Error(`Node: ${JSON.stringify(node)} doesn't have an associated Sequelize Model`);
}
exports.gqlToDb = gqlToDb;
//# sourceMappingURL=db-to-gql.js.map