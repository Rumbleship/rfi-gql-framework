"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oid_1 = require("@rumbleship/oid");
exports.modelKey = Symbol.for('model');
exports.apiKey = Symbol.for('api');
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
                return dbToGql(nodeService, concreteClass, from, this.oidScope);
            }
        }
        throw Error(`couldnt find concrete class for: ${discriminator}`);
    }
    getClassFor(discriminator) {
        return this.concreteClassMap.get(discriminator);
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
 * @param nodeService
 * @param to
 * @param from
 * @param oidScope
 */
function dbToGql(nodeService, to, from, oidScope) {
    const modelAsPlain = from.get( /*{ plain: true }*/);
    // DEAL WITH associated Models....
    //
    // Have we already done this transforation?
    if (exports.apiKey in from) {
        return Reflect.get(from, exports.apiKey);
    }
    const obj = Object.assign(new to(), modelAsPlain);
    const oid = oid_1.Oid.Create(oidScope ? oidScope : obj.constructor['name'], modelAsPlain.uuid ? modelAsPlain.uuid : modelAsPlain.id);
    obj.id = oid;
    obj._service = nodeService;
    // store for future use
    Reflect.set(obj, exports.modelKey, from);
    Reflect.set(from, exports.apiKey, obj);
    return obj;
}
exports.dbToGql = dbToGql;
async function reloadNodeFromModel(node, fromDb = true) {
    if (exports.modelKey in node) {
        const model = Reflect.get(node, exports.modelKey);
        if (fromDb) {
            await model.reload();
        }
        const modelAsPlain = model.get({ plain: true, clone: true });
        delete modelAsPlain.id;
        Object.assign(node, modelAsPlain);
    }
    return node;
}
exports.reloadNodeFromModel = reloadNodeFromModel;
//# sourceMappingURL=db-to-gql.js.map