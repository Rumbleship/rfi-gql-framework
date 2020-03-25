"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spyglass_1 = require("@rumbleship/spyglass");
const typedi_1 = require("typedi");
const acl_1 = require("@rumbleship/acl");
const uuid = require("uuid");
class RumbleshipContextOptionsWithDefaults {
    constructor(filename, options) {
        var _a, _b, _c, _d;
        this._config = options.config;
        this._id = (_a = options.id, (_a !== null && _a !== void 0 ? _a : uuid.v4()));
        this._initial_trace_metadata = options.initial_trace_metadata
            ? { name: 'app.rumbleship_context', ...options.initial_trace_metadata }
            : {
                name: 'app.rumbleship_context'
            };
        // remember that for some reason Spyglass takes the entire config object and pulls out its details
        // instead of just expecting what it needs
        this._logger = (_b = options.logger, (_b !== null && _b !== void 0 ? _b : spyglass_1.logging.getLogger({ config: this.config, filename })));
        this._authorizer = (_c = options.authorizer, (_c !== null && _c !== void 0 ? _c : new acl_1.Authorizer(acl_1.createAuthHeader({
            user: Reflect.get(this.config, 'serviceUser').id,
            roles: {},
            scopes: [acl_1.Scopes.SYSADMIN]
        }, Reflect.get(this.config, 'microservices').alpha.accessTokenSecret, { expiresIn: '5m' }), Reflect.get(this.config, 'microservices').alpha.accessTokenSecret)));
        this._authorizer.authenticate();
        this._container = (_d = options.container, (_d !== null && _d !== void 0 ? _d : typedi_1.default.of(this.id)));
    }
    get authorizer() {
        return this._authorizer;
    }
    get container() {
        return this._container;
    }
    get id() {
        return this._id;
    }
    get initial_trace_metadata() {
        return this._initial_trace_metadata;
    }
    get logger() {
        return this._logger;
    }
    get config() {
        return this._config;
    }
}
class RumbleshipContext {
    constructor(id, container, logger, authorizer, beeline) {
        this.id = id;
        this.container = container;
        this.logger = logger;
        this.authorizer = authorizer;
        this.beeline = beeline;
    }
    static initialize(serviceFactories, addSequelizeServicesToContext) {
        this._serviceFactories = serviceFactories;
        this.addSequelizeServicesToContext = addSequelizeServicesToContext;
        this.initialized = true;
    }
    static make(filename, options) {
        if (!this.initialized) {
            throw new Error('Must initialize the RumbleshipContext before making instances');
        }
        const { authorizer, container, id, logger } = new RumbleshipContextOptionsWithDefaults(filename, options);
        container.set('logger', logger);
        container.set('authorizer', authorizer);
        for (const [factory_name, factory] of this._serviceFactories.entries()) {
            container.set(factory_name, factory);
        }
        const beeline = container.get('beelineFactory').make(id);
        const ctx = new RumbleshipContext(id, container, logger, authorizer, beeline);
        logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
        const withSequelize = this.addSequelizeServicesToContext(ctx);
        return withSequelize;
    }
    release() {
        this.beeline.finishRumbleshipContextTrace();
        this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
        this.container.reset();
    }
}
exports.RumbleshipContext = RumbleshipContext;
RumbleshipContext.initialized = false;
function withRumbleshipContext(filename, options, fn) {
    const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(filename, options);
    const ctx = RumbleshipContext.make(filename, options);
    ctx.trace = ctx.beeline.startTrace({
        ...initial_trace_metadata
    }, ctx.id);
    return new Promise((resolve, reject) => {
        const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx));
        if (isPromise(value)) {
            // tslint:disable-next-line: no-floating-promises
            value
                .then(resolve)
                .catch(reject)
                .finally(() => ctx.release());
        }
        else {
            ctx.release();
            resolve(value);
        }
    });
}
exports.withRumbleshipContext = withRumbleshipContext;
function isPromise(p) {
    return p && typeof p.then === 'function';
}
/**
 * Provides a context that has an authorizer and credentials etc specifically for
 * THIS microservice so it can be used outside of the context of an Http/geaphql request
 * or GQL subscription.
 */
function getRumbleshipContext(filename, config) {
    // tslint:disable-next-line: no-console
    console.warn(`You probably DO NOT WANT to use this. 
  \tYou probably want to wrap your code with \`RumbleshipContext.withContext(cb: () => any)\`
  \tso you don't have to manage releasing the created context.
  \tIf you meant to use this, YOU MUST INVOKE \`context.release()\` otherwise memory leaks!`);
    const Factory = typedi_1.default.get('RumbleshipContext');
    return Factory.make(filename, { config });
}
exports.getRumbleshipContext = getRumbleshipContext;
function releaseRumbleshipContext(context) {
    context.beeline.finishRumbleshipContextTrace();
    context.logger.debug(`RELEASE SERVICE CONTEXT: ${context.id}`);
    context.container.reset();
}
exports.releaseRumbleshipContext = releaseRumbleshipContext;
//# sourceMappingURL=rumbleship-context.js.map