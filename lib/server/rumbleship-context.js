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
        this._marshalled_trace = options.marshalled_trace;
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
    get marshalled_trace() {
        return this._marshalled_trace;
    }
}
class RumbleshipContext {
    constructor(id, container, logger, authorizer, beeline, marshalled_trace) {
        this.id = id;
        this.container = container;
        this.logger = logger;
        this.authorizer = authorizer;
        this.beeline = beeline;
        this.marshalled_trace = marshalled_trace;
    }
    static initialize(serviceFactories, addSequelizeServicesToContext) {
        this._serviceFactories = serviceFactories;
        this.addSequelizeServicesToContext = addSequelizeServicesToContext;
        this.initialized = true;
    }
    static releaseAllContexts() {
        for (const ctx of RumbleshipContext.ActiveContexts.values()) {
            ctx.release();
        }
    }
    static make(filename, options, factories = RumbleshipContext._serviceFactories) {
        if (!this.initialized) {
            throw new Error('Must initialize the RumbleshipContext before making instances');
        }
        const { authorizer, container, id, logger, marshalled_trace } = new RumbleshipContextOptionsWithDefaults(filename, options);
        container.set('logger', logger);
        container.set('authorizer', authorizer);
        for (const [factory_name, factory] of factories.entries()) {
            container.set(factory_name, factory);
        }
        const beeline = container.get('beelineFactory').make(id);
        const ctx = new RumbleshipContext(id, container, logger, authorizer, beeline, marshalled_trace);
        RumbleshipContext.ActiveContexts.set(ctx.id, ctx);
        logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
        if (marshalled_trace) {
            console.log('Starting distributed trace');
            ctx.startDistributedTrace({ name: 'test' });
        }
        const withSequelize = this.addSequelizeServicesToContext(ctx);
        return withSequelize;
    }
    startDistributedTrace(span_data) {
        if (!this.marshalled_trace) {
            throw new Error('Cannot start a distributed trace without a marshalled trace');
        }
        const hydrated_trace = this.beeline.unmarshalTraceContext(this.marshalled_trace);
        return this.beeline.startTrace(span_data, hydrated_trace.traceId, hydrated_trace.parentSpanId, hydrated_trace.dataset);
    }
    release() {
        if (this.trace) {
            this.beeline.finishRumbleshipContextTrace();
        }
        this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
        this.container.reset();
    }
}
exports.RumbleshipContext = RumbleshipContext;
RumbleshipContext.initialized = false;
RumbleshipContext.ActiveContexts = new Map();
function withRumbleshipContext(filename, options, fn) {
    const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(filename, options);
    const ctx = typedi_1.default.get('RumbleshipContext').make(filename, options);
    ctx.trace = ctx.beeline.startTrace({
        ...initial_trace_metadata
    }, ctx.id);
    return new Promise((resolve, reject) => {
        const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx))();
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
function withLinkedRumbleshipContext(parentSpan, filename, options, fn) {
    const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(filename, options);
    const ctx = typedi_1.default.get('RumbleshipContext').make(filename, options);
    return ctx.beeline.runWithoutTrace(() => {
        ctx.trace = ctx.beeline.startTrace({
            ...initial_trace_metadata
        }, ctx.id);
        ctx.beeline.linkToSpan(parentSpan);
        return new Promise((resolve, reject) => {
            const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx))();
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
    });
}
exports.withLinkedRumbleshipContext = withLinkedRumbleshipContext;
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