import { DocumentNode } from 'graphql';
/**
 * From apollographql/subscriptions-transport-ws
 * Extracted as we want to minimise dependancies...
 * @param document
 * @param operationName
 */
export declare function isASubscriptionOperation(document: DocumentNode, operationName?: string): boolean;
