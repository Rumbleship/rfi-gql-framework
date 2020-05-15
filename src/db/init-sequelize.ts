import { Sequelize, Model, ModelCtor } from 'sequelize-typescript';
import { Oid } from '@rumbleship/oid';

let theSequelizeInstance: Sequelize | null;
/**
 * Returns the global instance of sequelize used by this application
 */
export function getSequelizeInstance(): Sequelize | null {
  return theSequelizeInstance;
}

/**
 * Nulls the global sequelize instance (for testing purposes)
 */
export function nullSequelizeInstance() {
  theSequelizeInstance = null;
}

export interface DbModelAndOidScope {
  scope: string;
  dbModel: ModelCtor & typeof Model;
}
const theDbModels: DbModelAndOidScope[] = [];

export function getScopeFor(model: Model) {
  const found = theDbModels.find(entry => model instanceof entry.dbModel);
  return found?.scope;
}
export function getOidFor(model: Model) {
  const scope = getScopeFor(model);
  if (!scope) {
    throw new Error(`Cant find Scope for model: ${model.constructor.name}`);
  }
  return Oid.create(scope, model.id);
}
/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param config An object with the shape: { db: { database, username, password, dialect, host, port, pool, socketPath, define }}
 * This is modified and passed to new Sequelize()
 * @param loggingFun The logging function to pass in. Required
 * @param dbModels An array of sequelize-typescript models for this application
 * @param opt options...
 * force: true forces a sync on the database creating new tables.
 * dbSuffix is added to the configured name and is used in development and test environments to
 * create isolated test databases in test suites
 * pubSub is the PubSubEngine to use to publish model changes
 */
export async function initSequelize(
  config: any,
  loggingFun: (msg: string) => any,
  dbModels: DbModelAndOidScope[],
  opt?: {
    force: boolean;
    dbSuffix?: string;
  }
): Promise<Sequelize> {
  const force = opt ? opt.force : false;
  const dbSuffix = opt ? (opt.dbSuffix ? opt.dbSuffix : '') : '';
  const {
    db: { database, username, password, dialect, host, port, pool, socketPath, define }
  } = config;
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
      dialectOptions: { socketPath, maxPreparedStatements: 10 }
    };
  } else {
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

  if (['test', 'development'].includes(process.env.NODE_ENV as string) && dbSuffix.length) {
    options.database = '';
    const temporarySequelize = new Sequelize(options);
    await temporarySequelize.query(`DROP DATABASE IF EXISTS ${db};`);
    await temporarySequelize.query(`CREATE DATABASE ${db};`);
    options.database = db;
  }
  theSequelizeInstance = new Sequelize(options);
  theDbModels.push(...dbModels);
  theSequelizeInstance.addModels(dbModels.map(entry => entry.dbModel));

  if (force) {
    await theSequelizeInstance.sync({ force });
  }
  return theSequelizeInstance;
}

// support for testing:
export async function resetAllTables(): Promise<void> {
  if (['test', 'development'].includes(process.env.NODE_ENV as string)) {
    if (theSequelizeInstance) {
      await theSequelizeInstance.sync({ force: true }); // force the tables to be dropped and recreated
    }
  }
}
