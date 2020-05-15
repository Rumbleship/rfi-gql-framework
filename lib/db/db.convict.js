"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvictDatabaseSchema = {
    host: {
        doc: 'Database host',
        format: String,
        default: 'mysql.local-rumbleship.com',
        env: 'DB_HOST'
    },
    port: {
        doc: 'Database port',
        format: 'port',
        default: 1306,
        env: 'DB_PORT'
    },
    database: {
        doc: 'Database name',
        format: String,
        default: 'banking',
        env: 'DB_DATABASE'
    },
    dialect: {
        doc: 'Database dialect',
        format: String,
        default: 'mysql',
        env: 'DB_DIALECT'
    },
    dialectOptions: {
        socketPath: {
            doc: 'Database connection socket',
            format: '*',
            default: undefined,
            env: 'DB_SOCKET'
        },
        maxPreparedStatements: {
            doc: 'Tune the number of prepared statements the mysql2 lib keeps open (distinct from what the mysql server manages)',
            format: Number,
            default: undefined,
            env: 'DB_DIALECT_MAX_PREPARED_STATEMENTS'
        }
    },
    username: {
        doc: 'Database user',
        format: String,
        default: 'root',
        env: 'DB_USERNAME'
    },
    password: {
        doc: 'Database password',
        format: String,
        default: 'rumbleship',
        env: 'DB_PASSWORD',
        sensitive: true
    },
    logging: {
        doc: 'Database logging',
        format: Boolean,
        default: false,
        env: 'DB_LOGGING'
    },
    define: {
        underscored: {
            doc: 'underscore table names',
            format: Boolean,
            default: true,
            env: 'DB_DEFINE__UNDERSCORED'
        }
    },
    pool: {
        min: {
            doc: 'Minimum number of DB connections to keep open',
            format: Number,
            default: 0,
            env: 'DB_POOL_MIN'
        },
        max: {
            doc: 'Maximum number of DB connections to keep open',
            format: Number,
            default: 32,
            env: 'DB_POOL_MAX'
        },
        idle: {
            doc: 'Maximum number of milliseconds to keep a pool connection open before releasing it',
            format: Number,
            default: 30000,
            env: 'DB_POOL_IDLE'
        },
        acquire: {
            doc: 'The maximum time, in milliseconds, that pool will try to get connection before throwing error',
            format: Number,
            default: 60000,
            env: 'DB_POOL_ACQUIRE'
        },
        evict: {
            doc: 'The time interval, in milliseconds, for evicting stale connections. Set it to 0 to disable this feature.',
            format: Number,
            default: 10000,
            env: 'DB_POOL_EVICT'
        },
        handleDisconnects: {
            doc: 'Controls if pool should handle connection disconnect automatically without throwing errors',
            format: Boolean,
            default: true,
            env: 'DB_POOL_HANDLE_DISCONNECTS'
        }
    }
};
//# sourceMappingURL=db.convict.js.map