"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQeuedSubscriptionOidForThisService = exports.getQueuedSubscriptionRequestScopeName = exports.getServiceShortCode = exports.getRelayPrefixLowerCase = exports.getRelayPrefix = exports.init_queued_subscription_relay = void 0;
const lodash_1 = require("lodash");
/**
 * MUST be called at the beginning of the bootstrap process before any of the queued subscription
 * code is called
 * @param service_name Name to use to prefix the GraphQl schema types
 */
function init_queued_subscription_relay(service_name, service_short_code, queued_subscription_request_scope_name = 'QueuedSubscriptionRequest') {
    setServiceName(service_name, service_short_code);
    setQueuedSubscriptionRequestScopeName(queued_subscription_request_scope_name);
}
exports.init_queued_subscription_relay = init_queued_subscription_relay;
let _the_service_name;
let _the_service_short_code;
let _queued_subscription_request_scope_name;
function getRelayPrefix() {
    return lodash_1.capitalize(_the_service_name !== null && _the_service_name !== void 0 ? _the_service_name : '');
}
exports.getRelayPrefix = getRelayPrefix;
function getRelayPrefixLowerCase() {
    return lodash_1.lowerFirst(_the_service_name !== null && _the_service_name !== void 0 ? _the_service_name : '');
}
exports.getRelayPrefixLowerCase = getRelayPrefixLowerCase;
function getServiceShortCode() {
    return _the_service_short_code;
}
exports.getServiceShortCode = getServiceShortCode;
function getQueuedSubscriptionRequestScopeName() {
    return _queued_subscription_request_scope_name;
}
exports.getQueuedSubscriptionRequestScopeName = getQueuedSubscriptionRequestScopeName;
function isQeuedSubscriptionOidForThisService(oid) {
    const { scope } = oid.unwrap();
    // the service this library is used by will
    if (scope !== getQueuedSubscriptionRequestScopeName()) {
        return false;
    }
    const oid_string = oid.toString();
    // Find everything until the first '.' and return it:-
    const regExp = /^([^\.]*)\./;
    const result = oid_string.match(regExp);
    const test1 = 'tere.xyz_123ed'.match(regExp);
    const test2 = '.asdas.asd_223'.match(regExp);
    // tslint:disable-next-line: no-console
    console.log(`${test1} : ${test2}`);
    if (result === null || result === void 0 ? void 0 : result.length) {
        const found_short_code = result[1];
        if (found_short_code === getServiceShortCode()) {
            return true;
        }
    }
    return false;
}
exports.isQeuedSubscriptionOidForThisService = isQeuedSubscriptionOidForThisService;
function setServiceName(name, service_short_code) {
    _the_service_name = name;
    _the_service_short_code = service_short_code;
}
function setQueuedSubscriptionRequestScopeName(name) {
    _queued_subscription_request_scope_name = name;
}
//# sourceMappingURL=init_queued_subscription_relay.js.map