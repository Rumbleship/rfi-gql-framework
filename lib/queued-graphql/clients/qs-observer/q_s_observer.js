"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQsoHandlers = exports.QSObserver = exports.QUEUED_SUBSCRIPTION_OBSERVER_META = void 0;
/**
 * QsrObservers are similar to Resolvers, however rahter than doing a class level
 * decorator, we make all QsrObservers derive from this base calss.. this may change in future
 * to match the style of type-graphql...
 */
exports.QUEUED_SUBSCRIPTION_OBSERVER_META = Symbol('QueuedSubscriptionObserver');
function QSObserver(metadata) {
    return function (target, propertyKey, descriptor) {
        var _a;
        // cache all the observers onto the target
        if (descriptor.value && typeof descriptor.value === 'function') {
            const meta = (_a = Reflect.getMetadata(exports.QUEUED_SUBSCRIPTION_OBSERVER_META, target)) !== null && _a !== void 0 ? _a : [];
            const handler = {
                qso_metadata: metadata,
                handler: descriptor.value
            };
            meta.push(handler);
            Reflect.defineMetadata(exports.QUEUED_SUBSCRIPTION_OBSERVER_META, meta, target);
        }
    };
}
exports.QSObserver = QSObserver;
function getQsoHandlers(target) {
    var _a, _b;
    // We need to set the target class here, as it is at this point that the
    // class is fully formed
    const handlers = (_b = (_a = Reflect.getMetadata(exports.QUEUED_SUBSCRIPTION_OBSERVER_META, target)) !== null && _a !== void 0 ? _a : Reflect.getMetadata(exports.QUEUED_SUBSCRIPTION_OBSERVER_META, target.prototype)) !== null && _b !== void 0 ? _b : [];
    handlers.forEach(handler => {
        handler.observer_class = target;
    });
    return handlers;
}
exports.getQsoHandlers = getQsoHandlers;
//# sourceMappingURL=q_s_observer.js.map