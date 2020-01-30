import { Sequelize, Model, ModelCtor } from 'sequelize-typescript';
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
export declare function initSequelize(config: any, loggingFun: (msg: string) => any, dbModels: DbModelAndOidScope[], opt?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Sequelize>;
export declare function resetAllTables(): Promise<void>;
