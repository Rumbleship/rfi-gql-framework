"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnDemandRumbleshipContext = void 0;
const _1 = require(".");
const acl_1 = require("@rumbleship/acl");
class OnDemandRumbleshipContext {
    constructor(marshalled_acl, isQueuedSubscription = true) {
        this.marshalled_acl = marshalled_acl;
        this.isQueuedSubscription = isQueuedSubscription;
        this._authorizer = undefined;
    }
    getAuthorizer() {
        if (!this._authorizer) {
            this._authorizer = acl_1.Authorizer.make(this.marshalled_acl);
        }
        return this._authorizer;
    }
    get wrappedContext() {
        if (!this._wrappedContext) {
            this._wrappedContext = _1.RumbleshipContext.make(__filename, {
                authorizer: this.getAuthorizer()
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
            this._wrappedContext = undefined;
            // reset the authorization as the context is long lived and we will
            // want to check the authorization in future
            this._authorizer = undefined;
            await toRelease.release();
        }
    }
}
exports.OnDemandRumbleshipContext = OnDemandRumbleshipContext;
//# sourceMappingURL=on-demand-rumbleship-context.js.map