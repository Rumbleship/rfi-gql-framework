import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek';
import { Container } from 'typedi';
import { buildSchema, BuildSchemaOptions } from 'type-graphql';
import { ConnectionContext } from 'subscriptions-transport-ws';
import { printSchema, GraphQLSchema } from 'graphql';
import { writeFileSync } from 'fs';
import { InvalidJWTError, Authorizer } from '@rumbleship/acl';
import { ApolloServer, AuthenticationError, Config } from '@rumbleship/apollo-server-hapi';
import { ISharedSchema } from '@rumbleship/config';
import { RumbleshipContextControl, getRumbleshipContextFrom } from '@rumbleship/context-control';
import { ServiceFactories, ServiceFactoryMap } from '@rumbleship/service-factory-map';
import { spyglassHapiPlugin, logging } from '@rumbleship/spyglass';
import { RumbleshipBeeline, HoneycombMiddleware, addGaeVersionDataToTrace } from '@rumbleship/o11y';
import { RumbleshipContext } from './../rumbleship-context';
import { initSequelize, DbModelAndOidScope } from './init-sequelize';
import { RFIAuthChecker, LogErrorMiddlewareFn } from './middleware';
import { attachConnectionHooks } from './watch-connection-pool';

import { goodRfi, logErrorsPlugin } from './plugins';
import { RfiPubSub } from './rfi-pub-sub-engine';
import { root_route, health_check_route } from './routes/health-checks.route';
import { DateRange, DateRangeGQL } from '../../gql';

import hapiRequireHttps = require('hapi-require-https');
import hapiRequestIdHeader = require('hapi-request-id-header');

import { Oid } from '@rumbleship/oid';
import { QueuedCacheScopeAndDb } from '../../queued-graphql';
import { addErrorToTraceContext } from '../honeycomb-helpers/add_error_to_trace_context';
import {
  initQueuedGraphql,
  startQueuedGraphQl,
  stopQueuedGraphQl
} from '../../queued-graphql/init_queued_graphql';

export let globalGraphQlSchema: GraphQLSchema | undefined;

export async function initServer(
  config: ISharedSchema,
  InjectedBeeline: typeof RumbleshipBeeline,
  injected_hapi_plugins: Array<Hapi.ServerRegisterPluginObject<any>>,
  injected_apollo_server_options: Pick<Config, 'plugins' | 'uploads'> = {},
  injected_models: DbModelAndOidScope[],
  injected_schema_options: Omit<BuildSchemaOptions, 'authChecker' | 'pubSub' | 'container'>,

  injected_routes: Hapi.ServerRoute[] = [],
  onContainer: (context: RumbleshipContext, ServiceFactories: ServiceFactoryMap) => void,
  onInitialized: (server: Hapi.Server, pubSub: RfiPubSub) => Promise<void> = (
    _server: Hapi.Server,
    _pubSub: RfiPubSub
  ) => Promise.resolve(),
  dbOptions?: {
    force: boolean;
    dbSuffix?: string;
  }
): Promise<Hapi.Server> {
  Authorizer.initialize(config);

  const rumbleshipContextFactory = Container.get<typeof RumbleshipContext>('RumbleshipContext');
  const serverLogger = logging.getLogger(config.Logging, { filename: __filename });
  const serverOptions: Hapi.ServerOptions = config.HapiServerOptions;
  const default_hapi_plugins: Array<Hapi.ServerRegisterPluginObject<any>> = [
    { plugin: hapiRequireHttps },
    { plugin: hapiRequestIdHeader, options: { persist: true } },
    {
      plugin: spyglassHapiPlugin,
      options: { Logging: config.Logging, options: { filename: __filename } }
    },
    { plugin: goodRfi, options: config }, // Winston and good logging a la RFI style - see spyglass
    {
      plugin: RumbleshipContextControl,
      options: {
        injected_config: config,
        authorizer_secret: config.AccessToken.secret,
        global_container: Container
      }
    }
  ];
  const hapi_plugins = [...default_hapi_plugins, ...injected_hapi_plugins];

  // We support injection of upload details and plugins.
  const default_apollo_server_options: Pick<Config, 'plugins' | 'uploads'> = {
    plugins: [logErrorsPlugin],
    uploads: undefined
  };
  const apollo_options = Hoek.merge(default_apollo_server_options, injected_apollo_server_options);

  if (serverOptions.routes) {
    serverOptions.routes.validate = {
      failAction: (request: Hapi.Request, h: Hapi.ResponseToolkit, error: any) => {
        const { beeline } = h as any;
        const { message, stack, object, details, output } = error as any;
        const metadata = {
          error: {
            stack,
            object,
            details
          }
        };
        beeline.withTraceContextFromRequestId(request.info.id, () => {
          beeline.finishSpan(
            beeline.startSpan({
              name: 'bad_request',
              'error.stack': stack,
              'error.message': message,
              'error.object': object,
              'error.details': details
            })
          );
        })();
        serverLogger.warn('bad_request', metadata);
        throw Boom.badRequest(`Invalid request ${output?.payload?.validation?.source} input`);
      }
    };
  }
  const server: Hapi.Server = InjectedBeeline.shimFromInstrumentation(
    new Hapi.Server(serverOptions)
  );

  injected_models.push(QueuedCacheScopeAndDb);
  const sequelize = await initSequelize(
    config.Db,
    msg => serverLogger.debug(msg),
    injected_models,
    dbOptions
  );
  await sequelize.authenticate();
  if (config.traceDatabaseConnectionHooks) {
    attachConnectionHooks();
  }

  const pubSub = new RfiPubSub(
    config.Gcp.gaeVersion,
    config.serviceName,
    config.PubSub,
    config.Gcp.Auth,
    InjectedBeeline
  );
  if (config.PubSub.resetHostedSubscriptions) {
    try {
      await pubSub.deleteCurrentSubscriptionsMatchingPrefix();
    } catch (error) {
      serverLogger.error('Error deleting subscriptions', error);
    }
    try {
      await pubSub.createSubscriptionsFor(injected_models);
    } catch (error) {
      serverLogger.error('Error creating subscriptions...', error);
    }
  }

  const default_schema_options: BuildSchemaOptions = {
    authChecker: RFIAuthChecker,
    scalarsMap: [{ type: DateRange, scalar: DateRangeGQL }],
    globalMiddlewares: [HoneycombMiddleware, LogErrorMiddlewareFn],
    resolvers: [] as any,
    pubSub,
    container: ({ context }: { context: RumbleshipContext }) => context.container
  };
  const schema_options = Hoek.merge(default_schema_options, injected_schema_options);
  globalGraphQlSchema = await buildSchema(schema_options).catch(err => {
    serverLogger.error(err.stack);
    if (err.details && Array.isArray(err.details)) {
      for (const detail of err.details) {
        serverLogger.error(detail.stack);
      }
    }
    throw err;
  });
  const schemaAsString = printSchema(globalGraphQlSchema);
  if (config.GqlSchema.schemaPrintFile) {
    writeFileSync(config.GqlSchema.schemaPrintFile, schemaAsString);
  }

  pubSub.linkToSequelize(sequelize);
  const apolloServer = new ApolloServer({
    schema: globalGraphQlSchema,
    introspection: true,
    subscriptions: {
      onConnect: (connectionParams, webSocket, context: ConnectionContext) => {
        const bearer_token =
          (connectionParams as any).Authorization || (connectionParams as any).authorization;
        if (bearer_token) {
          const authorizer = (() => {
            try {
              return Authorizer.make(bearer_token, true);
            } catch (error) {
              if (error instanceof InvalidJWTError) {
                throw new AuthenticationError(error.message);
              }
              throw error;
            }
          })();
          try {
            authorizer.authenticate();
          } catch (e) {
            throw new AuthenticationError(e.message);
          }
          const rumbleship_context = rumbleshipContextFactory.make(__filename, {
            authorizer,
            initial_trace_metadata: {
              subscription: true
            }
          });
          (context as any).rumbleship_context = rumbleship_context;
          return context;
        }
        throw new AuthenticationError('Access Token Required');
      },
      /**
       * NB: It's hard to get this to trigger with Playground. Hitting "stop" is insufficient.
       */
      onDisconnect: (_webSocket, context) => {
        const { rumbleship_context } = context as any;
        if (rumbleship_context) {
          setImmediate(() => (rumbleship_context as RumbleshipContext).release());
        }
      }
    },
    context: async (ctx: any, _connection: any): Promise<RumbleshipContext> => {
      const rumbleship_context: RumbleshipContext = (ctx.request as Hapi.Request)
        ? // normal request
          getRumbleshipContextFrom(ctx.request)
        : // RumbleshipContextControl.getContextFrom(request)
          // subscription
          ctx.connection.context.rumbleship_context;
      const user = rumbleship_context.authorizer.getUser();
      rumbleship_context.beeline.addTraceContext({
        user: { id: user, scope: new Oid(user).unwrap().scope }
      });
      // To consider: plugin that attaches this doesn't build the rumbleship_context for all routes
      // but Apollo seems to trigger this `context` generation call for some (all?) of them.
      // e.g. `GET /graphql` triggers this, but we don't build our context.
      // Is just returning ok?
      const { container } = rumbleship_context ?? {};
      if (container && onContainer) {
        // Hook to to allow Banking to continue inject/hook up its old services when the context is built.
        // Probably shouldnt use this for anything else.
        onContainer(rumbleship_context, ServiceFactories);
      }
      return rumbleship_context;
    },
    ...apollo_options
  });
  await apolloServer.applyMiddleware({
    app: server
  });
  // Set up subscriptions for websocket clients
  apolloServer.installSubscriptionHandlers(server.listener);
  // setup subscription server for GooglePubSub  clients
  initQueuedGraphql(config, globalGraphQlSchema, injected_schema_options.resolvers as any);

  server.events.on('start', async () => {
    const ctx = RumbleshipContext.make(__filename, {
      initial_trace_metadata: {
        name: 'QueuedGql.start'
      }
    });
    try {
      // these function starts all the active queued subscriptions and requests and then returns
      //
      await startQueuedGraphQl(ctx);
    } catch (error) {
      addErrorToTraceContext(ctx, error);
      serverLogger.error(error);
      serverLogger.error('Error starting Queued graphql servers');
      throw error;
    } finally {
      await ctx.release();
    }
  });
  // setup the routines to gracefully shut down the Event Dispatcher and pubsub.
  // Note that startServer calls server.stop() on receipt of a SIGTERM signel, which in turn will
  // emit the 'stop' event
  server.events.on('stop', async () => {
    const ctx = RumbleshipContext.make(__filename, {
      initial_trace_metadata: {
        name: 'QueuedGql.stop'
      }
    });
    try {
      await stopQueuedGraphQl(ctx);
    } catch (error) {
      addErrorToTraceContext(ctx, error);
      serverLogger.error('Error stopping  Queued graphql servers', {
        stack: error.stack,
        message: error.message
      });
      throw error;
    } finally {
      await ctx.release();
    }
  });

  await server.register(hapi_plugins);
  server.route([root_route, health_check_route, ...injected_routes]);

  server.ext('onRequest', (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    /**
     * Strongly prefer the RumbleshipContext helper, but we don't build the context for
     * `/_ah/health` or `/` routes, where we pick it off the `Hapi.ResponseToolkit` as
     * decorated by top level instrumentation
     */
    addGaeVersionDataToTrace(
      () => getRumbleshipContextFrom(request)?.beeline ?? (h as any).beeline
    );
    return h.continue;
  });
  await onInitialized(server, pubSub);
  return server;
}
