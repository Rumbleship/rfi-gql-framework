import { PubSub as GooglePubSub } from '@google-cloud/pubsub';

import { ISharedSchema } from '@rumbleship/config';
import {
  execute,
  ExecutionResult,
  GraphQLError,
  GraphQLSchema,
  parse,
  printError,
  specifiedRules,
  validate
} from 'graphql';
import { QUEUED_GRAPHQL_REQUEST_TOPIC } from '../../interfaces/topic_manifest_constants';

import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { gcpGetTopic, GqlExecutionParams, isASubscriptionOperation } from '../../helpers';
import {
  IQueuedGqlRequest,
  IQueuedGqlResponse
} from '../../interfaces/queued-gql-request.interface';

import { RfiPubSubSubscription } from '../../shared/rfi-pubsub-subscription';
import { AddToTrace } from '@rumbleship/o11y';

import { addErrorToTraceContext } from '../../../app/honeycomb-helpers/add_error_to_trace_context';

/**
 * Complement to the queuedeSubscription service that listens for straight graphql queries and mutations
 * on a GRAPHQL_REQUEST channel and responds to the request over the topic passed in to the request.
 *
 * Note multiple services can respond the the same request. If the request is for an operation that is not supported it is acked to the pubsub engine,
 * but no response is given. If how ever the graphql is malformed, all services may respond.
 *
 * If the response is understood by one or more services, but has some othewr error, then a response will be given.
 *
 *
 * This is an 'inner ring' service that only runs internally to the
 * @note publishes responses to gql queries/mutations recieved over queue.
 * @see queued-gql-request-client
 */
export class QueuedGqlRequestServer {
  public request_topic_name: string;
  public request_subscription_name: string;
  public service_name: string;

  protected _request_subscription: RfiPubSubSubscription<IQueuedGqlRequest>;
  protected _pubsub: GooglePubSub;
  constructor(public config: ISharedSchema, private schema: GraphQLSchema) {
    this.request_topic_name = `${config.PubSub.topicPrefix}${QUEUED_GRAPHQL_REQUEST_TOPIC}`;
    this.service_name = config.serviceName;
    // Only one instance of a service should receive and process a request
    this.request_subscription_name = `${this.request_topic_name}_${config.serviceName}`;
    this._pubsub = new GooglePubSub(config.Gcp.Auth);
    this._pubsub.projectId = this._pubsub.projectId.replace('-private', '-public');
    this._request_subscription = new RfiPubSubSubscription(
      config,
      this._pubsub,
      this.request_topic_name,
      this.request_subscription_name,
      false
    );
  }
  @AddToTrace()
  async start(ctx: RumbleshipContext): Promise<void> {
    // this is a long running promise chain that loops listening for messages
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._request_subscription.start(
      async (ctx: RumbleshipContext, request: IQueuedGqlRequest): Promise<void> => {
        let executionResult: ExecutionResult | undefined;
        ctx.beeline.addTraceContext({ request });
        ctx.beeline.addTraceContext({
          pubsub: { projectId: this._pubsub.projectId },
          config: {
            PubSub: this.config.PubSub,
            Gcp: {
              Auth: this.config.Gcp.Auth
            }
          }
        });
        try {
          if (this.isRequestSyncQsrs(request) && this.shouldProcessSyncRequest()) {
            const executionParams = ctx.beeline.bindFunctionToTrace(() =>
              QueuedGqlRequestServer.validateGqlRequest(this.schema, request)
            )();
            executionResult = await execute({
              schema: this.schema,
              contextValue: ctx,
              document: executionParams.query,
              variableValues: executionParams.variables,
              operationName: executionParams.operationName
            });
          }
        } catch (error) {
          addErrorToTraceContext(ctx, error, false); // add to context but set 'alert to false as this is expected
          if (request.respond_on_error) {
            const gqlError =
              error instanceof GraphQLError
                ? error
                : new GraphQLError(
                    error.message ?? 'error during request execution',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    error
                  );

            if (request.publish_to_topic_name) {
              await this.publishResponse(ctx, request, { errors: [gqlError] });
            }
          }
        }
        if (executionResult) {
          ctx.beeline.addTraceContext({ executionResult });
          await this.publishResponse(ctx, request, executionResult);
        }
      }
    );
  }

  @AddToTrace()
  async publishResponse(
    ctx: RumbleshipContext,
    request: IQueuedGqlRequest,
    executionResponse: ExecutionResult
  ): Promise<string> {
    const message: IQueuedGqlResponse = {
      client_request_id: request.client_request_id,
      service_name: this.service_name,
      response: executionResponse
    };
    const topic = await gcpGetTopic(this._pubsub, request.publish_to_topic_name, false);
    const payload = JSON.stringify(message);
    ctx.beeline.addTraceContext({
      pubsub: {
        projectId: this._pubsub.projectId,
        topic: { name: topic.name },
        config: {
          PubSub: this.config.PubSub,
          Gcp: {
            Auth: this.config.Gcp.Auth
          }
        }
      }
    });
    return topic.publish(Buffer.from(payload));
  }

  @AddToTrace()
  async stop(ctx: RumbleshipContext): Promise<void> {
    ctx.beeline.addTraceContext({
      pubsub: { projectId: this._pubsub.projectId },
      config: {
        PubSub: this.config.PubSub,
        Gcp: {
          Auth: this.config.Gcp.Auth
        }
      }
    });
    if (this._request_subscription) {
      await this._request_subscription.stop();
    }
  }

  isRequestSyncQsrs(request: IQueuedGqlRequest): boolean {
    return !!request.client_request_id.match(/\w+\.syncQsrs/);
  }
  shouldProcessSyncRequest(): boolean {
    return this.config.serviceName === 'orders';
  }
  static validateGqlRequest(
    schema: GraphQLSchema,
    subscriptionRequest: IQueuedGqlRequest
  ): GqlExecutionParams {
    // parse will throw an error if there are any parse errors
    const gqlDocument = parse(subscriptionRequest.gql_query_string ?? '');
    const executionParams: GqlExecutionParams = { query: gqlDocument };

    if (isASubscriptionOperation(gqlDocument, subscriptionRequest.operation_name)) {
      throw new Error(
        'query for subscription must be requesteed via the queuedeSubscriptionServer'
      );
    }

    const errors = validate(schema, gqlDocument, specifiedRules);
    if (errors.length) {
      const errString = JSON.stringify(
        errors.map(error => printError(error)),
        undefined,
        2
      );
      // todo add explict tracing
      throw new Error(errString);
    }

    if (subscriptionRequest.query_attributes) {
      // will throw if invalid
      executionParams.variables = JSON.parse(subscriptionRequest.query_attributes);
    }
    executionParams.operationName = subscriptionRequest.operation_name;
    return executionParams;
  }
}

export class QueuedRequestClient {}
