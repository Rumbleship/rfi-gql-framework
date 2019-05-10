import { Sequelize, Model } from 'sequelize-typescript';

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

/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param config An object with the shape: { db: { database, username, password, dialect, host, port, pool, socketPath, define }}
 * This is modified and passed to new Sequelize()
 * @param loggingFun The logging function to pass in. Required
 * @param dbModels An array of sequelize-typescript models for this application
 * @param opt options... force: true forces a sync on the database creating new tables.
 * dbSuffix is added to the configured name and is used in development and test environments to
 * create isolated test databases in test suites
 */
export async function initSequelize(
  config: any,
  loggingFun: (msg: string) => any,
  dbModels: Array<typeof Model>,
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
      dialectOptions: { socketPath }
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

  theSequelizeInstance.addModels(dbModels);

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
