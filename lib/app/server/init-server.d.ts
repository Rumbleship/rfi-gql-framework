import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import { BuildSchemaOptions } from 'type-graphql';
import { ApolloServerPlugin } from '@rumbleship/apollo-server-hapi';
import { RfiPubSubConfig, RumbleshipDatabaseOptions } from '@rumbleship/config';
import { ServiceFactoryMap } from '@rumbleship/service-factory-map';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { RumbleshipContext } from './../rumbleship-context';
import { DbModelAndOidScope } from './init-sequelize';
export interface ConvictServerConfig {
    serverOptions: Hapi.ServerOptions;
    db: RumbleshipDatabaseOptions;
    logging: {
        level: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug';
    };
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
export declare function initServer(config: ConvictServerConfig, InjectedBeeline: typeof RumbleshipBeeline, injected_hapi_plugins: Array<Hapi.ServerRegisterPluginObject<any>>, injected_apollo_plugins: ApolloServerPlugin<Record<string, any>>[] | undefined, injected_models: DbModelAndOidScope[], injected_schema_options: Omit<BuildSchemaOptions, 'authChecker' | 'pubSub' | 'container'>, injected_routes: Hapi.ServerRoute[] | undefined, onContainer: (context: RumbleshipContext, ServiceFactories: ServiceFactoryMap) => void, onInitialized?: (server: Hapi.Server) => Promise<void>, dbOptions?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Hapi.Server>;
