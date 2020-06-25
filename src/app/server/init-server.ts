import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek';
import Container from 'typedi';
import { buildSchema, BuildSchemaOptions } from 'type-graphql';
import { ConnectionContext } from 'subscriptions-transport-ws';
import { printSchema } from 'graphql';
import { writeFileSync } from 'fs';
import { InvalidJWTError, Authorizer } from '@rumbleship/acl';
import { ApolloServer, AuthenticationError } from '@rumbleship/apollo-server-hapi';
import { RumbleshipContextControl, getRumbleshipContextFrom } from '@rumbleship/context-control';
import { ServiceFactories } from '@rumbleship/service-factory-map';
import { spyglassHapiPlugin, logging } from '@rumbleship/spyglass';
import { RumbleshipBeeline, HoneycombMiddleware, addGaeVersionDataToTrace } from '@rumbleship/o11y';
import { RfiPubSubConfig, RumbleshipDatabaseOptions } from './../config';
import { RumbleshipContext } from './../rumbleship-context';
import { initSequelize, DbModelAndOidScope } from './init-sequelize';
import { RFIAuthChecker } from './middleware';
import { goodRfi } from './plugins';
import { RfiPubSub } from './rfi-pub-sub-engine';
import { root_route, health_check_route } from './routes';

export interface ConvictServerConfig {
  serverOptions: Hapi.ServerOptions;
  db: RumbleshipDatabaseOptions;
  microservices: {
    alpha: { [index: string]: any } & { accessTokenSecret: string };
    mediator: { [index: string]: any };
    banking: { [index: string]: any };
    arbiter: { [index: string]: any };
  };
  gae_version: string;
  graphQl: { printSchemaOnStartup: string; schemaPrintFile: string };
  PubSubConfig: RfiPubSubConfig;
}

export async function initServer(
  config: ConvictServerConfig,
  injected_plugins: Array<Hapi.Plugin<any>>,
  injected_models: DbModelAndOidScope[],
  injected_schema_options: Omit<BuildSchemaOptions, 'authChecker' | 'pubSub' | 'container'>,
  injected_routes: Hapi.ServerRoute[] = [],
  onContainer: (context: RumbleshipContext, ServiceFactories: Map<any, any>) => void,
  onInitialized: (server: Hapi.Server) => Promise<void> = (_server: Hapi.Server) =>
    Promise.resolve(),
  dbOptions?: {
    force: boolean;
    dbSuffix?: string;
  }
): Promise<Hapi.Server> {
  const rumbleshipContextFactory = Container.get<typeof RumbleshipContext>('RumbleshipContext');
  const serverLogger = logging.getLogger({ filename: __filename, config });
  const serverOptions: Hapi.ServerOptions = config.serverOptions;
  const default_plugins: Array<Hapi.Plugin<any>> = [
    ...require('hapi-require-https'),
    { plugin: require('hapi-request-id-header'), options: { persist: true } },
    { plugin: spyglassHapiPlugin, options: { config } },
    { plugin: goodRfi }, // Winston and good logging a la RFI style - see spyglass
    {
      plugin: RumbleshipContextControl,
      options: {
        injected_config: config,
        authorizer_secret: config.microservices.alpha.accessTokenSecret,
        global_container: Container
      }
    }
    // This should be injected by caller; not all services will need it.
    // {
    //   plugin: new RumbleshipVendorWebhookAuth(),
    //   options: {
    //     schemes: [
    //       {
    //         name: 'plaid',
    //         plaid_factory: ServiceFactories.get('plaidClientFactory'),
    //         enable_tracing: true
    //       }
    //     ]
    //   }
    // }
  ];
  const plugins = [...default_plugins, ...injected_plugins];
  if (serverOptions.routes) {
    serverOptions.routes.validate = {
      failAction: (request: Hapi.Request, h: Hapi.ResponseToolkit, err: any) => {
        if (process.env.NODE_ENV) {
          if (['test', 'development'].includes(process.env.NODE_ENV)) {
            serverLogger.error(err);
            throw err;
          }
        }
        serverLogger.error('Validation error', err.message);
        throw Boom.badRequest(`Invalid request ${err.output.payload.validation.source} input`);
      }
    };
  }
  const server: Hapi.Server = RumbleshipBeeline.shimFromInstrumentation(
    new Hapi.Server(serverOptions)
  );
  const sequelize = await initSequelize(
    config.db,
    msg => serverLogger.debug(msg),
    injected_models,
    dbOptions
  );
  await sequelize.authenticate();

  const pubSub = new RfiPubSub(config.gae_version, config.PubSubConfig, RumbleshipBeeline);
  if (config.PubSubConfig.resetHostedSubscriptions) {
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

  const default_schema_options: Omit<BuildSchemaOptions, 'resolvers'> = {
    authChecker: RFIAuthChecker,
    globalMiddlewares: [HoneycombMiddleware],
    pubSub,
    container: ({ context }: { context: RumbleshipContext }) => context.container
  };
  const schema_options = Hoek.merge(default_schema_options, injected_schema_options);
  const schema = await buildSchema(schema_options).catch(err => {
    serverLogger.error(err.stack);
    for (const detail of err.details) {
      serverLogger.error(detail.stack);
    }
    throw err;
  });
  const schemaAsString = printSchema(schema);
  if (config.graphQl.printSchemaOnStartup) {
    writeFileSync(config.graphQl.schemaPrintFile, schemaAsString);
  }

  pubSub.linkToSequelize(sequelize);
  // linkSequelizeToPubSubEngine(pubSub, sequelize);
  // per request dependancy injection is accomplished by using the
  // typedi container that was created by the per-request-di-container plugin
  // the plugin will take care of resetting it after request is serviced
  const apolloServer = new ApolloServer({
    schema,
    formatError: (error: any) => {
      serverLogger.error(error.originalError ? error.originalError.stack : error.stack);
      return error;
    },
    introspection: true,
    subscriptions: {
      onConnect: (connectionParams, webSocket, context: ConnectionContext) => {
        const bearer_token =
          (connectionParams as any).Authorization || (connectionParams as any).authorization;
        if (bearer_token) {
          const authorizer = (() => {
            try {
              return new Authorizer(bearer_token, config.microservices.alpha.accessTokenSecret);
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
            config,
            initial_trace_metadata: {
              subscription: true
            }
          });
          rumbleship_context.trace = rumbleship_context.beeline.startTrace({
            name: 'subscription'
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
    }
  });
  await apolloServer.applyMiddleware({
    app: server
  });
  apolloServer.installSubscriptionHandlers(server.listener);
  await server.register(plugins);
  await server.route([root_route, health_check_route, ...injected_routes]);

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
  await onInitialized(server);
  return server;
}
