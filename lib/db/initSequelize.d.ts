import { Sequelize, Model } from 'sequelize-typescript';
export declare function getSequelizeInstance(): Sequelize | null;
export declare function nullSequelizeInstance(): void;
/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param opt
 */
export declare function initSequelize(config: any, loggingFun: ((msg: string) => any) | false, dbModels: Array<typeof Model>, opt?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Sequelize>;
export declare function resetAllTables(): Promise<void>;
