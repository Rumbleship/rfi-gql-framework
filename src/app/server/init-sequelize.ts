import { Sequelize, Model, ModelCtor } from 'sequelize-typescript';
import { RumbleshipDatabaseOptions } from '@rumbleship/config';
import { Oid } from '@rumbleship/oid';
import { ModelClass } from '../../db';

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
export function nullSequelizeInstance(): void {
  theSequelizeInstance = null;
}

export interface DbModelAndOidScope {
  scope: string;
  dbModel: ModelCtor & typeof Model;
}
const theDbModels: DbModelAndOidScope[] = [];

export function getScopeFor(model: Model | ModelClass<any>): string | undefined {
  const found = theDbModels.find(
    entry => model instanceof entry.dbModel || entry.dbModel === model
  );
  return found?.scope;
}
export function getOidFor(model: Model): Oid {
  const scope = getScopeFor(model);
  if (!scope) {
    throw new Error(`Cant find Scope for model: ${model.constructor.name}`);
  }
  return Oid.Create(scope, model.id);
}
/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param cfg A Sequelize Configuration object, passed directly, or ((DEPRECATED)) nested under a key `{db: cfg}`
 * { database, username, password, dialect, host, port, pool, define, dialectOptions: { socketPath, maxPreparedStatements }}
 * @param loggingFun The logging function to pass in. Required
 * @param dbModels An array of sequelize-typescript models for this application
 * @param opts options...
 * force: true forces a sync on the database creating new tables.
 * dbSuffix is added to the configured name and is used in development and test environments to
 * create isolated test databases in test suites
 * pubSub is the PubSubEngine to use to publish model changes
 */
export async function initSequelize(
  cfg: RumbleshipDatabaseOptions | { db: RumbleshipDatabaseOptions },
  loggingFun: (msg: string) => any,
  dbModels: DbModelAndOidScope[],
  opts?: {
    force: boolean;
    dbSuffix?: string;
  }
): Promise<Sequelize> {
  // Forward/backward compatibility with old format of passing entire app config in.
  const config: RumbleshipDatabaseOptions = Reflect.get(cfg, 'db') ?? cfg;
  const force = opts?.force ?? false;
  const { database, username, password, dialect, host, port, pool, define } = config;
  const db = buildDbName(database, opts?.dbSuffix);

  const options: RumbleshipDatabaseOptions = {
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
  } else {
    options.host = host;
    options.port = port;
  }

  if (config.dialectOptions) {
    if (
      ['test', 'development'].includes(process.env.NODE_ENV as string) &&
      opts?.dbSuffix?.length
    ) {
      options.database = '';
      const temporarySequelize = new Sequelize(options);
      await temporarySequelize.query(`DROP DATABASE IF EXISTS ${db};`);
      await temporarySequelize.query(`CREATE DATABASE ${db};`);
      options.database = db;
    }
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

export function buildDbName(name?: string, suffix?: string): string {
  if (!name) {
    throw new Error('database name must be specified');
  }
  return name + (suffix ? (suffix && suffix[0] === '_' ? suffix : `_${suffix}`) : '');
}
