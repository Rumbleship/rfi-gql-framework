"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let theSequelizeInstance;
function getSequelizeInstance() {
    return theSequelizeInstance;
}
exports.getSequelizeInstance = getSequelizeInstance;
function nullSequelizeInstance() {
    theSequelizeInstance = null;
}
exports.nullSequelizeInstance = nullSequelizeInstance;
/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param opt
 */
async function initSequelize(config, loggingFun, dbModels, opt) {
    const force = opt ? opt.force : false;
    const dbSuffix = opt ? (opt.dbSuffix ? opt.dbSuffix : '') : '';
    const { db: { database, username, password, dialect, host, port, pool, socketPath, define } } = config;
    const db = database + dbSuffix;
    let options;
    if (socketPath) {
        options = {
            database: db,
            username,
            password,
            dialect,
            pool,
            logging: loggingFun,
            define,
            dialectOptions: { socketPath }
        };
    }
    else {
        options = {
            database: db,
            username,
            password,
            dialect,
            logging: loggingFun,
            define,
            host,
            port
        };
    }
    if (['test', 'development'].includes(process.env.NODE_ENV) && dbSuffix.length) {
        options.database = '';
        const temporarySequelize = new sequelize_typescript_1.Sequelize(options);
        await temporarySequelize.query(`DROP DATABASE IF EXISTS ${db};`);
        await temporarySequelize.query(`CREATE DATABASE ${db};`);
        options.database = db;
    }
    theSequelizeInstance = new sequelize_typescript_1.Sequelize(options);
    theSequelizeInstance.addModels(dbModels);
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
//# sourceMappingURL=initSequelize.js.map