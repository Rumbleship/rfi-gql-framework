import { PubSub as GooglePubSub } from '@google-cloud/pubsub';

import { ISharedSchema } from '@rumbleship/config';
import {
  execute,
  ExecutionResult,
  GraphQLError,
  GraphQLSchema,
  parse,
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
 *
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
    this._request_subscription = new RfiPubSubSubscription(
      config,
      this._pubsub,
      this.request_topic_name,
      this.request_subscription_name
    );
  }
  async start(ctx: RumbleshipContext): Promise<void> {
    // this is a long running promise chain that loops listening for messages
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._request_subscription.start(
      async (request: IQueuedGqlRequest, ctx: RumbleshipContext): Promise<void> => {
        let executionResult: ExecutionResult | undefined;
        try {
          const executionParams = QueuedGqlRequestServer.validateGqlRequest(this.schema, request);
          executionResult = await execute({
            schema: this.schema,
            contextValue: ctx,
            document: executionParams.query,
            variableValues: executionParams.variables,
            operationName: executionParams.operationName
          });
        } catch (error) {
          if (request.respond_on_error) {
            const gqlError =
              error instanceof GraphQLError
                ? error
                : new GraphQLError(
                    'error during request ewxecution',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    error
                  );
            // TODO add traceing honeycomb
            ctx.logger.log('Errors in QueuedGqlResponse', {
              client_request_id: request.client_request_id,
              query: request.gql_query_string,
              errors: gqlError
            });
            if (request.publish_to_topic_name) {
              await this.publishResponse(request, { errors: [gqlError] });
            }
          }
        }
        if (executionResult) {
          if (executionResult.errors) {
            // TODO add traceing honeycomb
            ctx.logger.log('Errors in QueuedGqlResponse', {
              client_request_id: request.client_request_id,
              query: request.gql_query_string,
              errors: executionResult.errors
            });
          }
          await this.publishResponse(request, executionResult);
        }
      }
    );
  }

  async publishResponse(
    request: IQueuedGqlRequest,
    executionResponse: ExecutionResult
  ): Promise<string> {
    const message: IQueuedGqlResponse = {
      client_request_id: request.client_request_id,
      service_name: this.service_name,
      response: executionResponse
    };
    const topic = await gcpGetTopic(this._pubsub, request.publish_to_topic_name);
    const payload = JSON.stringify(message);
    return topic.publish(Buffer.from(payload));
  }

  async stop(): Promise<void> {
    if (this._request_subscription) {
      await this._request_subscription.stop();
    }
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
      const errString = JSON.stringify(errors, undefined, 2);
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
