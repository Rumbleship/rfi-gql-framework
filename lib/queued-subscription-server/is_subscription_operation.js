"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isASubscriptionOperation = void 0;
const graphql_1 = require("graphql");
/**
 * From apollographql/subscriptions-transport-ws
 * Extracted as we want to minimise dependancies...
 * @param document
 * @param operationName
 */
function isASubscriptionOperation(document, operationName) {
    const operationAST = graphql_1.getOperationAST(document, operationName);
    return !!operationAST && operationAST.operation === 'subscription';
}
exports.isASubscriptionOperation = isASubscriptionOperation;
//# sourceMappingURL=is_subscription_operation.js.map