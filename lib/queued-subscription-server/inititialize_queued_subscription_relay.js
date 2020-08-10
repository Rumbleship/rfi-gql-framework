"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueuedSubscriptionRequestNodeServiceEntry = exports.isQeuedSubscriptionOidForThisService = exports.getQueuedSubscriptionRequestScopeName = exports.getServiceShortCode = exports.getRelayPrefixLowerCase = exports.getRelayPrefix = exports.inititializeQueuedSubscriptionRelay = void 0;
const lodash_1 = require("lodash");
const oid_1 = require("@rumbleship/oid");
const queued_subscription_request_model_1 = require("./queued_subscription_request/db/queued_subscription_request.model");
const queued_subscription_request_service_1 = require("./queued_subscription_request/db/queued_subscription_request.service");
/**
 * MUST be called at the beginning of the bootstrap process before any of the queued subscription
 * code is called
 *
 * These functions are kept as top level functions as they are used across the various layers
 * in our architecture, and so we dont want to have them as, for example, statics on QueuedSubscriptionServer
 * as that could cause some nasty unneccessary circular debendancies
 *
 * @param service_name Name to use to prefix the GraphQl schema types
 *
 *
 */
function inititializeQueuedSubscriptionRelay(config, queued_subscription_request_scope_name = 'QueuedSubscriptionRequest') {
    setServiceName(config.serviceName, config.serviceShortCode);
    // each microservice that uses the queuedSubscriptionSerer, must locally register its own scope short code
    // it is a little confusing, but is necessary to allow for properly federated/stiched schemas at the
    // distributed architecture level.
    //
    oid_1.Oid.RegisterScope(queued_subscription_request_scope_name, `${config.serviceShortCode}.qsr`);
    setQueuedSubscriptionRequestScopeName(queued_subscription_request_scope_name);
    return {
        scope: queued_subscription_request_scope_name,
        dbModel: queued_subscription_request_model_1.QueuedSubscriptionRequestModel
    };
}
exports.inititializeQueuedSubscriptionRelay = inititializeQueuedSubscriptionRelay;
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
    if (result === null || result === void 0 ? void 0 : result.length) {
        const found_short_code = result[1];
        if (found_short_code === getServiceShortCode()) {
            return true;
        }
    }
    return false;
}
exports.isQeuedSubscriptionOidForThisService = isQeuedSubscriptionOidForThisService;
function getQueuedSubscriptionRequestNodeServiceEntry(context) {
    return {
        [getQueuedSubscriptionRequestScopeName()]: new queued_subscription_request_service_1.QueuedSubscriptionRequestServiceSequelize(context)
    };
}
exports.getQueuedSubscriptionRequestNodeServiceEntry = getQueuedSubscriptionRequestNodeServiceEntry;
function setServiceName(name, service_short_code) {
    _the_service_name = name;
    _the_service_short_code = service_short_code;
}
function setQueuedSubscriptionRequestScopeName(name) {
    _queued_subscription_request_scope_name = name;
}
//# sourceMappingURL=inititialize_queued_subscription_relay.js.map