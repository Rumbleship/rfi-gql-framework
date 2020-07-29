import { Sequelize, Model, ModelCtor } from 'sequelize-typescript';
import { RumbleshipDatabaseOptions } from '@rumbleship/config';
import { Oid } from '@rumbleship/oid';
/**
 * Returns the global instance of sequelize used by this application
 */
export declare function getSequelizeInstance(): Sequelize | null;
/**
 * Nulls the global sequelize instance (for testing purposes)
 */
export declare function nullSequelizeInstance(): void;
export interface DbModelAndOidScope {
    scope: string;
    dbModel: ModelCtor & typeof Model;
}
export declare function getScopeFor(model: Model): string | undefined;
export declare function getOidFor(model: Model): Oid;
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
export declare function initSequelize(cfg: RumbleshipDatabaseOptions | {
    db: RumbleshipDatabaseOptions;
}, loggingFun: (msg: string) => any, dbModels: DbModelAndOidScope[], opts?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Sequelize>;
export declare function resetAllTables(): Promise<void>;
