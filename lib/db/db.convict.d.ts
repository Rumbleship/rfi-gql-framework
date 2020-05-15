import { SequelizeOptions } from 'sequelize-typescript';
/**
 * Sequelize description:
 * An object of additional options, which are passed directly to the connection library
 *
 * These are the values we explicitly expect.
 *
 * `socketPath` is how we connect in hosted environments
 *
 * `maxPreparedStatements` is because Sequelize does not appear to manage releasing prepared statements
 *    when using Operators, e.g. {[Op.in]: []}. See linked issues:
 * https://github.com/sidorares/node-mysql2/blob/0c422dd9d88a211015ddf4fcc8531048de9b1340/documentation/Prepared-Statements.md
 * https://github.com/sequelize/sequelize/issues/10832
 * https://github.com/sequelize/sequelize/issues/10942
 */
export interface DialectOptions {
    dialectOptions: {
        socketPath?: string;
        maxPreparedStatements?: number;
    };
}
export declare type RumbleshipDatabaseOptions = SequelizeOptions & DialectOptions;
export declare const ConvictDatabaseSchema: {
    host: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    port: {
        doc: string;
        format: string;
        default: number;
        env: string;
    };
    database: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    dialect: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    dialectOptions: {
        socketPath: {
            doc: string;
            format: string;
            default: undefined;
            env: string;
        };
        maxPreparedStatements: {
            doc: string;
            format: NumberConstructor;
            default: undefined;
            env: string;
        };
    };
    username: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    password: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
        sensitive: boolean;
    };
    logging: {
        doc: string;
        format: BooleanConstructor;
        default: boolean;
        env: string;
    };
    define: {
        underscored: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
    pool: {
        min: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        max: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        idle: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        acquire: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        evict: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        handleDisconnects: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
};
