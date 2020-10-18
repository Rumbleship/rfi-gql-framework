"use strict";
/**
 * This can be expanded to include different types of Exceptions where we cna harvest and trace interesting
 * additional attribues off the error instance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addErrorToTraceContext = void 0;
const message_queues_1 = require("@google-cloud/pubsub/build/src/message-queues");
const message_stream_1 = require("@google-cloud/pubsub/build/src/message-stream");
const publish_error_1 = require("@google-cloud/pubsub/build/src/publisher/publish-error");
const graphql_1 = require("graphql");
const types_1 = require("sequelize/types");
function addErrorToTraceContext(ctx, error) {
    let metadata = {
        'error.name': error.name,
        'error.message': error.message,
        'error.stack': error.stack,
        // add some often seen attributes from multiple external packages
        'error.code': Reflect.get(error, 'code')
    };
    // common exceptions in the framework
    // sequelize...
    if (error instanceof types_1.ValidationError /* sequelize error */) {
        metadata = { ...metadata, ...{ 'error.errors': error.errors } };
    }
    if (error instanceof types_1.ConnectionError) {
        metadata = { ...metadata, ...{ 'error.parent': error.parent } };
    }
    if (error instanceof types_1.DatabaseError) {
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
    if (error instanceof types_1.OptimisticLockError) {
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
    if (error instanceof publish_error_1.PublishError ||
        error instanceof message_queues_1.BatchError ||
        error instanceof message_stream_1.ChannelError ||
        error instanceof message_stream_1.StatusError) {
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
    if (error instanceof graphql_1.GraphQLError) {
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
exports.addErrorToTraceContext = addErrorToTraceContext;
//# sourceMappingURL=add_error_to_trace_context.js.map