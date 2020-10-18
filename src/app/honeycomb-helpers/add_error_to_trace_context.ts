/**
 * This can be expanded to include different types of Exceptions where we cna harvest and trace interesting
 * additional attribues off the error instance
 */

import { BatchError } from '@google-cloud/pubsub/build/src/message-queues';
import { ChannelError, StatusError } from '@google-cloud/pubsub/build/src/message-stream';
import { PublishError } from '@google-cloud/pubsub/build/src/publisher/publish-error';
import { GraphQLError } from 'graphql';
import {
  ConnectionError,
  DatabaseError,
  OptimisticLockError,
  ValidationError
} from 'sequelize/types';
import { RumbleshipContext } from '../rumbleship-context';

export function addErrorToTraceContext(ctx: RumbleshipContext, error: Error): void {
  let metadata = {
    'error.name': error.name,
    'error.message': error.message,
    'error.stack': error.stack,
    // add some often seen attributes from multiple external packages
    'error.code': Reflect.get(error, 'code')
  };

  // common exceptions in the framework

  // sequelize...
  if (error instanceof ValidationError /* sequelize error */) {
    metadata = { ...metadata, ...{ 'error.errors': error.errors } };
  }
  if (error instanceof ConnectionError) {
    metadata = { ...metadata, ...{ 'error.parent': error.parent } };
  }
  if (error instanceof DatabaseError) {
    metadata = {
      ...metadata,
      ...{
        'error.parent': error.parent,
        'error.parameters': error.parameters,
        'error.original': error.original,
        'error.sql': error.sql
      }
    };
  }
  if (error instanceof OptimisticLockError) {
    // sequelize 5 doesnt correctly expose these attribute... so use reflection
    metadata = {
      ...metadata,
      ...{
        'error.modelName': Reflect.get(error, 'modelName'),
        'error.values': Reflect.get(error, 'values'),
        'error.where': Reflect.get(error, 'where')
      }
    };
  }
  // for google pubsub
  //

  if (
    error instanceof PublishError ||
    error instanceof BatchError ||
    error instanceof ChannelError ||
    error instanceof StatusError
  ) {
    // Documentation is somewhat inconsistent some errors are cdocumented but not excposed etc.
    metadata = {
      ...metadata,
      ...{
        'error.package': 'gcloud.pubsub',
        'error.code': error.code,
        'error.err': Reflect.get(error, 'err'),
        'error.error': Reflect.get(error, 'error'),
        'error.details': error.details,
        'error.orderingKey': Reflect.get(error, 'orderingKey'),
        'error.metadata': error.metadata,
        'error.status': Reflect.get(error, 'status')
      }
    };
  }
  if (error instanceof GraphQLError) {
    metadata = {
      ...metadata,
      ...{
        'error.extensions': error.extensions,
        'error.source': error.source,
        'error.locations': error.locations,
        'error.nodes': error.nodes,
        'error.originalError': error.originalError,
        'error.path': error.path,
        'error.positions': error.positions
      }
    };
  }

  ctx.beeline.addTraceContext(metadata);
}
