"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = void 0;
require("reflect-metadata");
const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const Hoek = require("@hapi/hoek");
const typedi_1 = require("typedi");
const type_graphql_1 = require("type-graphql");
const graphql_1 = require("graphql");
const fs_1 = require("fs");
const acl_1 = require("@rumbleship/acl");
const apollo_server_hapi_1 = require("@rumbleship/apollo-server-hapi");
const context_control_1 = require("@rumbleship/context-control");
const service_factory_map_1 = require("@rumbleship/service-factory-map");
const spyglass_1 = require("@rumbleship/spyglass");
const o11y_1 = require("@rumbleship/o11y");
const init_sequelize_1 = require("./init-sequelize");
const middleware_1 = require("./middleware");
const plugins_1 = require("./plugins");
const rfi_pub_sub_engine_1 = require("./rfi-pub-sub-engine");
const routes_1 = require("./routes");
const gql_1 = require("../../gql");
const hapiRequireHttps = require("hapi-require-https");
const hapiRequestIdHeader = require("hapi-request-id-header");
async function initServer(config, InjectedBeeline, injected_hapi_plugins, injected_apollo_server_options = {}, injected_models, injected_schema_options, injected_routes = [], onContainer, onInitialized = (_server, _pubSub) => Promise.resolve(), dbOptions) {
    const rumbleshipContextFactory = typedi_1.default.get('RumbleshipContext');
    const serverLogger = spyglass_1.logging.getLogger({ filename: __filename, config });
    const serverOptions = config.serverOptions;
    const default_hapi_plugins = [
        { plugin: hapiRequireHttps },
        { plugin: hapiRequestIdHeader, options: { persist: true } },
        { plugin: spyglass_1.spyglassHapiPlugin, options: { config } },
        { plugin: plugins_1.goodRfi, options: config },
        {
            plugin: context_control_1.RumbleshipContextControl,
            options: {
                injected_config: config,
                authorizer_secret: config.microservices.alpha.accessTokenSecret,
                global_container: typedi_1.default
            }
        }
    ];
    const hapi_plugins = [...default_hapi_plugins, ...injected_hapi_plugins];
    // We support injection of upload details and plugins.
    const default_apollo_server_options = {
        plugins: [plugins_1.logErrorsPlugin],
        uploads: undefined
    };
    const apollo_options = Hoek.merge(default_apollo_server_options, injected_apollo_server_options);
    if (serverOptions.routes) {
        serverOptions.routes.validate = {
            failAction: (request, h, error) => {
                var _a, _b;
                const { beeline } = h;
                const { message, stack, object, details, output } = error;
                const metadata = {
                    error: {
                        stack,
                        object,
                        details
                    }
                };
                beeline.withTraceContextFromRequestId(request.info.id, () => {
                    beeline.finishSpan(beeline.startSpan({
                        name: 'bad_request',
                        'error.stack': stack,
                        'error.message': message,
                        'error.object': object,
                        'error.details': details
                    }));
                })();
                serverLogger.warn('bad_request', metadata);
                throw Boom.badRequest(`Invalid request ${(_b = (_a = output === null || output === void 0 ? void 0 : output.payload) === null || _a === void 0 ? void 0 : _a.validation) === null || _b === void 0 ? void 0 : _b.source} input`);
            }
        };
    }
    const server = InjectedBeeline.shimFromInstrumentation(new Hapi.Server(serverOptions));
    const sequelize = await init_sequelize_1.initSequelize(config.db, msg => serverLogger.debug(msg), injected_models, dbOptions);
    await sequelize.authenticate();
    const pubSub = new rfi_pub_sub_engine_1.RfiPubSub(config.gae_version, config.PubSubConfig, InjectedBeeline);
    if (config.PubSubConfig.resetHostedSubscriptions) {
        try {
            await pubSub.deleteCurrentSubscriptionsMatchingPrefix();
        }
        catch (error) {
            serverLogger.error('Error deleting subscriptions', error);
        }
        try {
            await pubSub.createSubscriptionsFor(injected_models);
        }
        catch (error) {
            serverLogger.error('Error creating subscriptions...', error);
        }
    }
    const default_schema_options = {
        authChecker: middleware_1.RFIAuthChecker,
        scalarsMap: [{ type: gql_1.DateRange, scalar: gql_1.DateRangeGQL }],
        globalMiddlewares: [o11y_1.HoneycombMiddleware, middleware_1.LogErrorMiddlewareFn],
        pubSub,
        container: ({ context }) => context.container
    };
    const schema_options = Hoek.merge(default_schema_options, injected_schema_options);
    const schema = await type_graphql_1.buildSchema(schema_options).catch(err => {
        serverLogger.error(err.stack);
        for (const detail of err.details) {
            serverLogger.error(detail.stack);
        }
        throw err;
    });
    const schemaAsString = graphql_1.printSchema(schema);
    if (config.graphQl.printSchemaOnStartup) {
        fs_1.writeFileSync(config.graphQl.schemaPrintFile, schemaAsString);
    }
    pubSub.linkToSequelize(sequelize);
    const apolloServer = new apollo_server_hapi_1.ApolloServer({
        schema,
        introspection: true,
        subscriptions: {
            onConnect: (connectionParams, webSocket, context) => {
                const bearer_token = connectionParams.Authorization || connectionParams.authorization;
                if (bearer_token) {
                    const authorizer = (() => {
                        try {
                            return new acl_1.Authorizer(bearer_token, config.microservices.alpha.accessTokenSecret);
                        }
                        catch (error) {
                            if (error instanceof acl_1.InvalidJWTError) {
                                throw new apollo_server_hapi_1.AuthenticationError(error.message);
                            }
                            throw error;
                        }
                    })();
                    try {
                        authorizer.authenticate();
                    }
                    catch (e) {
                        throw new apollo_server_hapi_1.AuthenticationError(e.message);
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
                    context.rumbleship_context = rumbleship_context;
                    return context;
                }
                throw new apollo_server_hapi_1.AuthenticationError('Access Token Required');
            },
            /**
             * NB: It's hard to get this to trigger with Playground. Hitting "stop" is insufficient.
             */
            onDisconnect: (_webSocket, context) => {
                const { rumbleship_context } = context;
                if (rumbleship_context) {
                    setImmediate(() => rumbleship_context.release());
                }
            }
        },
        context: async (ctx, _connection) => {
            const rumbleship_context = ctx.request
                ? // normal request
                    context_control_1.getRumbleshipContextFrom(ctx.request)
                : // RumbleshipContextControl.getContextFrom(request)
                    // subscription
                    ctx.connection.context.rumbleship_context;
            // To consider: plugin that attaches this doesn't build the rumbleship_context for all routes
            // but Apollo seems to trigger this `context` generation call for some (all?) of them.
            // e.g. `GET /graphql` triggers this, but we don't build our context.
            // Is just returning ok?
            const { container } = rumbleship_context !== null && rumbleship_context !== void 0 ? rumbleship_context : {};
            if (container && onContainer) {
                // Hook to to allow Banking to continue inject/hook up its old services when the context is built.
                // Probably shouldnt use this for anything else.
                onContainer(rumbleship_context, service_factory_map_1.ServiceFactories);
            }
            return rumbleship_context;
        },
        ...apollo_options
    });
    await apolloServer.applyMiddleware({
        app: server
    });
    apolloServer.installSubscriptionHandlers(server.listener);
    await server.register(hapi_plugins);
    await server.route([routes_1.root_route, routes_1.health_check_route, ...injected_routes]);
    server.ext('onRequest', (request, h) => {
        /**
         * Strongly prefer the RumbleshipContext helper, but we don't build the context for
         * `/_ah/health` or `/` routes, where we pick it off the `Hapi.ResponseToolkit` as
         * decorated by top level instrumentation
         */
        o11y_1.addGaeVersionDataToTrace(() => { var _a, _b; return (_b = (_a = context_control_1.getRumbleshipContextFrom(request)) === null || _a === void 0 ? void 0 : _a.beeline) !== null && _b !== void 0 ? _b : h.beeline; });
        return h.continue;
    });
    await onInitialized(server, pubSub);
    return server;
}
exports.initServer = initServer;
//# sourceMappingURL=init-server.js.map