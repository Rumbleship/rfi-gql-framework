import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import { BuildSchemaOptions } from 'type-graphql';
import { RfiPubSubConfig, RumbleshipDatabaseOptions } from './../config';
import { RumbleshipContext } from './../rumbleship-context';
import { DbModelAndOidScope } from './init-sequelize';
export interface ConvictServerConfig {
    serverOptions: Hapi.ServerOptions;
    db: RumbleshipDatabaseOptions;
    microservices: {
        alpha: {
            [index: string]: any;
        } & {
            accessTokenSecret: string;
        };
        mediator: {
            [index: string]: any;
        };
        banking: {
            [index: string]: any;
        };
        arbiter: {
            [index: string]: any;
        };
    };
    gae_version: string;
    graphQl: {
        printSchemaOnStartup: string;
        schemaPrintFile: string;
    };
    PubSubConfig: RfiPubSubConfig;
}
export declare function initServer(config: ConvictServerConfig, injected_plugins: Array<Hapi.Plugin<any>>, injected_models: DbModelAndOidScope[], injected_schema_options: Omit<BuildSchemaOptions, 'authChecker' | 'pubSub' | 'container'>, injected_routes: Hapi.ServerRoute[] | undefined, onContainer: (context: RumbleshipContext, ServiceFactories: Map<any, any>) => void, onInitialized?: (server: Hapi.Server) => Promise<void>, dbOptions?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Hapi.Server>;
