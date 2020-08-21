import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import { BuildSchemaOptions } from 'type-graphql';
import { GraphQLSchema } from 'graphql';
import { Config } from '@rumbleship/apollo-server-hapi';
import { ISharedSchema } from '@rumbleship/config';
import { ServiceFactoryMap } from '@rumbleship/service-factory-map';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { RumbleshipContext } from './../rumbleship-context';
import { DbModelAndOidScope } from './init-sequelize';
import { RfiPubSub } from './rfi-pub-sub-engine';
export declare let globalGraphQlSchema: GraphQLSchema | undefined;
export declare function initServer(config: ISharedSchema, InjectedBeeline: typeof RumbleshipBeeline, injected_hapi_plugins: Array<Hapi.ServerRegisterPluginObject<any>>, injected_apollo_server_options: Pick<Config, "plugins" | "uploads"> | undefined, injected_models: DbModelAndOidScope[], injected_schema_options: Omit<BuildSchemaOptions, 'authChecker' | 'pubSub' | 'container'>, injected_routes: Hapi.ServerRoute[] | undefined, onContainer: (context: RumbleshipContext, ServiceFactories: ServiceFactoryMap) => void, onInitialized?: (server: Hapi.Server, pubSub: RfiPubSub) => Promise<void>, dbOptions?: {
    force: boolean;
    dbSuffix?: string;
}): Promise<Hapi.Server>;
