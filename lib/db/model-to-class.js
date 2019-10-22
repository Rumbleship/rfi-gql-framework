"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@rumbleship/types");
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
                return modelToClass(nodeService, concreteClass, from, this.oidScope);
            }
        }
        throw Error(`couldnt find concrete class for: ${discriminator}`);
    }
    getClassFor(discriminator) {
        return this.concreteClassMap.get(discriminator);
    }
}
exports.GqlSingleTableInheritanceFactory = GqlSingleTableInheritanceFactory;
// Creates a new Object of type T and fills it with the plain proerties of the Sequelize Model
// It is a SHALLOW copy...
function modelToClass(nodeService, to, from, oidScope) {
    const modelAsPlain = from.get({ plain: true });
    // Have we already done this transforation?
    if (exports.apiKey in from) {
        return Reflect.get(from, exports.apiKey);
    }
    const obj = Object.assign(new to(), modelAsPlain);
    const oid = types_1.Oid.create(oidScope ? oidScope : obj.constructor['name'], modelAsPlain.uuid ? modelAsPlain.uuid : modelAsPlain.id);
    obj.id = oid;
    obj._service = nodeService;
    // store for future use
    Reflect.set(obj, exports.modelKey, from);
    Reflect.set(from, exports.apiKey, obj);
    return obj;
}
exports.modelToClass = modelToClass;
async function reloadNodeFromModel(node, fromDb = true) {
    if (exports.modelKey in node) {
        const model = Reflect.get(node, exports.modelKey);
        if (fromDb) {
            await model.reload();
        }
        const modelAsPlain = model.get({ plain: true });
        delete modelAsPlain.id;
        Object.assign(node, modelAsPlain);
    }
    return node;
}
exports.reloadNodeFromModel = reloadNodeFromModel;
//# sourceMappingURL=model-to-class.js.map