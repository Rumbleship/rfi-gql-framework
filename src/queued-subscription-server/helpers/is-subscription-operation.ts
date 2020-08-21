import { DocumentNode, getOperationAST } from 'graphql';

/**
 * From apollographql/subscriptions-transport-ws
 * Extracted as we want to minimise dependancies...
 * @param document
 * @param operationName
 */

export function isASubscriptionOperation(document: DocumentNode, operationName?: string): boolean {
  const operationAST = getOperationAST(document, operationName);

  return !!operationAST && operationAST.operation === 'subscription';
}
