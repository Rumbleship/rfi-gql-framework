"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnDemandRumbleshipContext = void 0;
const _1 = require(".");
const o11y_1 = require("@rumbleship/o11y");
const uuid_1 = require("uuid");
class OnDemandRumbleshipContext {
    constructor(marshalled_acl, isQueuedSubscription = true) {
        this.marshalled_acl = marshalled_acl;
        this.isQueuedSubscription = isQueuedSubscription;
        this.on_demand_context_id = uuid_1.v4();
        this._authorizer = undefined;
    }
    static initialize(authorizer_cls) {
        OnDemandRumbleshipContext.AuthorizerCls = authorizer_cls;
    }
    getAuthorizer() {
        if (!this._authorizer) {
            this._authorizer = OnDemandRumbleshipContext.AuthorizerCls.make(this.marshalled_acl);
        }
        return this._authorizer;
    }
    get wrappedContext() {
        if (!this._wrappedContext) {
            this._wrappedContext = o11y_1.RumbleshipBeeline.runWithoutTrace(() => {
                return _1.RumbleshipContext.make(__filename, {
                    initial_trace_metadata: {
                        name: 'app.OnDemandRumbleshipContext',
                        on_demand_context_id: this.on_demand_context_id
                    },
                    authorizer: this.getAuthorizer()
                });
            });
        }
        return this._wrappedContext;
    }
    get authorizer() {
        return this.wrappedContext.authorizer;
    }
    get container() {
        return this.wrappedContext.container;
    }
    get id() {
        return this.wrappedContext.id;
    }
    get beeline() {
        return this.wrappedContext.beeline;
    }
    get logger() {
        return this.wrappedContext.logger;
    }
    get trace() {
        return this.wrappedContext.trace;
    }
    async release() {
        if (this._wrappedContext) {
            return this._wrappedContext.release();
        }
    }
    async reset() {
        if (this._wrappedContext) {
            const toRelease = this._wrappedContext;
            await toRelease.beeline.withAsyncSpan({ name: 'release' }, async () => {
                toRelease.beeline.finishSpan(toRelease.beeline.startSpan({ name: 'reset' }));
                this._wrappedContext = undefined;
                // reset the authorization as the context is long lived and we will
                // want to check the authorization in future
                this._authorizer = undefined;
                await toRelease.release();
            });
        }
    }
    makeChild(filename) {
        return _1.RumbleshipContext.make(filename, {
            marshalled_trace: this.beeline.marshalTraceContext(this.beeline.getTraceContext())
        });
    }
}
exports.OnDemandRumbleshipContext = OnDemandRumbleshipContext;
//# sourceMappingURL=on-demand-rumbleship-context.js.map