"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spyglass_1 = require("@rumbleship/spyglass");
const typedi_1 = require("typedi");
const acl_1 = require("@rumbleship/acl");
const uuid = require("uuid");
const db_1 = require("../db");
class RumbleshipContextOptionsWithDefaults {
    constructor(filename, options) {
        var _a, _b, _c, _d;
        this._config = options.config;
        this._id = (_a = options.id, (_a !== null && _a !== void 0 ? _a : uuid.v4()));
        this._marshalled_trace = options.marshalled_trace;
        this._linked_span = options.linked_span;
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
    get linked_span() {
        return this._linked_span;
    }
}
class RumbleshipContext {
    constructor(id, container, logger, authorizer, beeline, initial_trace_metadata, marshalled_trace, linked_span) {
        this.id = id;
        this.container = container;
        this.logger = logger;
        this.authorizer = authorizer;
        this.beeline = beeline;
        const hydrated_trace = this.beeline.unmarshalTraceContext(marshalled_trace);
        this.trace = this.beeline.startTrace({ name: 'rumbleship_context', ...initial_trace_metadata }, hydrated_trace.traceId, hydrated_trace.parentSpanId, hydrated_trace.dataset);
        if (linked_span) {
            this.beeline.linkToSpan(linked_span);
        }
    }
    static initialize(serviceFactories, addSequelizeServicesToContext) {
        this._serviceFactories = serviceFactories;
        this.addSequelizeServicesToContext = addSequelizeServicesToContext;
        this.initialized = true;
    }
    static async releaseAllContexts() {
        for (const ctx of RumbleshipContext.ActiveContexts.values()) {
            setImmediate(() => ctx.release());
        }
    }
    static make(filename, options, factories = RumbleshipContext._serviceFactories) {
        if (!this.initialized) {
            throw new Error('Must initialize the RumbleshipContext before making instances');
        }
        const { authorizer, container, id, logger, initial_trace_metadata, marshalled_trace, linked_span } = new RumbleshipContextOptionsWithDefaults(filename, options);
        container.set('logger', logger);
        container.set('authorizer', authorizer);
        for (const [factory_name, factory] of factories.entries()) {
            container.set(factory_name, factory);
        }
        const beeline = container.get('beelineFactory').make(id);
        const ctx = new RumbleshipContext(id, container, logger, authorizer, beeline, initial_trace_metadata, marshalled_trace, linked_span);
        RumbleshipContext.ActiveContexts.set(ctx.id, ctx);
        logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
        const withSequelize = this.addSequelizeServicesToContext(ctx);
        return withSequelize;
    }
    async release() {
        var _a, _b;
        try {
            const queries = [
                "SHOW GLOBAL STATUS LIKE 'com_stmt%';",
                "SHOW GLOBAL STATUS LIKE 'prepared_stmt_count'"
            ];
            const db_vars_honeycomb = {};
            for (const query of queries) {
                const [db_variables] = (_b = (await ((_a = db_1.getSequelizeInstance()) === null || _a === void 0 ? void 0 : _a.query(query))), (_b !== null && _b !== void 0 ? _b : [
                    []
                ]));
                for (const text_row of db_variables) {
                    const { Variable_name, Value } = text_row;
                    Reflect.set(db_vars_honeycomb, `db.variable.${Variable_name}`, Number(Value));
                }
            }
            this.beeline.addContext(db_vars_honeycomb);
            if (this.trace) {
                this.beeline.finishTrace(this.trace);
            }
        }
        catch (error) {
            this.logger.error(error);
        }
        finally {
            this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
            this.container.reset();
        }
    }
}
exports.RumbleshipContext = RumbleshipContext;
RumbleshipContext.initialized = false;
RumbleshipContext.ActiveContexts = new Map();
/** @deprecated ? */
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
                .finally(() => setImmediate(() => ctx.release()));
        }
        else {
            setImmediate(() => ctx.release());
            resolve(value);
        }
    });
}
exports.withRumbleshipContext = withRumbleshipContext;
function isPromise(p) {
    return p && typeof p.then === 'function';
}
//# sourceMappingURL=rumbleship-context.js.map