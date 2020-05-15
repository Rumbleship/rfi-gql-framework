"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const oid_1 = require("@rumbleship/oid");
let theSequelizeInstance;
/**
 * Returns the global instance of sequelize used by this application
 */
function getSequelizeInstance() {
    return theSequelizeInstance;
}
exports.getSequelizeInstance = getSequelizeInstance;
/**
 * Nulls the global sequelize instance (for testing purposes)
 */
function nullSequelizeInstance() {
    theSequelizeInstance = null;
}
exports.nullSequelizeInstance = nullSequelizeInstance;
const theDbModels = [];
function getScopeFor(model) {
    var _a;
    const found = theDbModels.find(entry => model instanceof entry.dbModel);
    return (_a = found) === null || _a === void 0 ? void 0 : _a.scope;
}
exports.getScopeFor = getScopeFor;
function getOidFor(model) {
    const scope = getScopeFor(model);
    if (!scope) {
        throw new Error(`Cant find Scope for model: ${model.constructor.name}`);
    }
    return oid_1.Oid.create(scope, model.id);
}
exports.getOidFor = getOidFor;
/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param cfg A Sequelize Configuration object, passed directly, or ((DEPRECATED)) nested under a key `{db: cfg}`
 * { database, username, password, dialect, host, port, pool, define, dialectOptions: { socketPath, maxPreparedStatements }}
 * @param loggingFun The logging function to pass in. Required
 * @param dbModels An array of sequelize-typescript models for this application
 * @param opt options...
 * force: true forces a sync on the database creating new tables.
 * dbSuffix is added to the configured name and is used in development and test environments to
 * create isolated test databases in test suites
 * pubSub is the PubSubEngine to use to publish model changes
 */
async function initSequelize(cfg, loggingFun, dbModels, opt) {
    var _a, _b, _c, _d, _e;
    // Forward/backward compatibility with old format of passing entire app config in.
    const config = (_a = Reflect.get(cfg, 'db'), (_a !== null && _a !== void 0 ? _a : cfg));
    const force = (_c = (_b = opt) === null || _b === void 0 ? void 0 : _b.force, (_c !== null && _c !== void 0 ? _c : false));
    const dbSuffix = (_e = (_d = opt) === null || _d === void 0 ? void 0 : _d.dbSuffix, (_e !== null && _e !== void 0 ? _e : ''));
    const { database, username, password, dialect, host, port, pool, define } = config;
    const db = database + '_' + dbSuffix;
    const options = {
        database: db,
        username,
        password,
        dialect,
        pool,
        logging: loggingFun,
        define,
        dialectOptions: {}
    };
    const { socketPath, ...dialectOptions } = config.dialectOptions;
    // mysql2 does not like undefined values in `dialectOptions`, so only set them if present.
    for (const [option, value] of Object.entries(dialectOptions)) {
        if (value) {
            Reflect.set(options.dialectOptions, option, value);
        }
    }
    // `socketPath` requires special treatment; its presence changes how we set `host` and `port`
    if (socketPath) {
        options.dialectOptions.socketPath = socketPath;
    }
    else {
        options.host = host;
        options.port = port;
    }
    if (config.dialectOptions) {
        if (['test', 'development'].includes(process.env.NODE_ENV) && dbSuffix.length) {
            options.database = '';
            const temporarySequelize = new sequelize_typescript_1.Sequelize(options);
            await temporarySequelize.query(`DROP DATABASE IF EXISTS ${db};`);
            await temporarySequelize.query(`CREATE DATABASE ${db};`);
            options.database = db;
        }
    }
    theSequelizeInstance = new sequelize_typescript_1.Sequelize(options);
    theDbModels.push(...dbModels);
    theSequelizeInstance.addModels(dbModels.map(entry => entry.dbModel));
    if (force) {
        await theSequelizeInstance.sync({ force });
    }
    return theSequelizeInstance;
}
exports.initSequelize = initSequelize;
// support for testing:
async function resetAllTables() {
    if (['test', 'development'].includes(process.env.NODE_ENV)) {
        if (theSequelizeInstance) {
            await theSequelizeInstance.sync({ force: true }); // force the tables to be dropped and recreated
        }
    }
}
exports.resetAllTables = resetAllTables;
//# sourceMappingURL=init-sequelize.js.map