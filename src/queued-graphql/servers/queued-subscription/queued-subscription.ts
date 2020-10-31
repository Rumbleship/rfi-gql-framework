import {
  GraphQLSchema,
  ExecutionResult,
  subscribe,
  parse,
  specifiedRules,
  validate
} from 'graphql';
import { GqlExecutionParams } from '../../helpers/gql-execution-params';
import { OnDemandRumbleshipContext } from '../../../app/rumbleship-context/on-demand-rumbleship-context';
import { isASubscriptionOperation } from '../../helpers/is-subscription-operation';
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
import { IGcpConfig } from '@rumbleship/config';
import { gcpGetTopic } from '../../helpers/gcp_helpers';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued-subscription-request.interface';
import { QueuedSubscriptionMessage } from './queued-subscription-message';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { AddToTrace, RumbleshipBeeline } from '@rumbleship/o11y';
import { addErrorToTraceContext } from '../../../app/honeycomb-helpers/add_error_to_trace_context';

export class QueuedSubscription implements IQueuedSubscriptionRequest {
  activeSubscription?: AsyncIterableIterator<
    ExecutionResult<{
      [key: string]: any;
    }>
  >;
  executionContext: GqlExecutionParams;
  owner_id?: string;
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  publish_to_topic_name: string;
  subscription_name?: string;
  marshalled_acl: string;
  active?: boolean;
  onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
  create_unique_subscription?: boolean;
  cache_consistency_id?: number;
  serviced_by!: string[];
  id: string;

  private _topic?: Topic;
  /**
   * Throws errors if the subscriptionRequest is not valid
   * @param schema
   * @param subscriptionRequest
   * @param publishToTopicName
   * @param pesistent_id
   */
  constructor(
    private schema: GraphQLSchema,
    subscriptionRequest: IQueuedSubscriptionRequest,
    config: IGcpConfig,
    private googlePublisher = new GooglePubSub(config.Auth)
  ) {
    this.googlePublisher.projectId = this.googlePublisher.projectId.replace('-private', '-public');
    // This object is a very longlived 'active' object, so we dont want to have
    // any unexpected side-effects of holding relay objects in memory and the
    // potential for large networks of objects and services never being garbage collected
    //
    //
    let id;
    ({
      gql_query_string: this.gql_query_string,
      query_attributes: this.query_attributes,
      operation_name: this.operation_name,
      publish_to_topic_name: this.publish_to_topic_name,
      subscription_name: this.subscription_name,
      marshalled_acl: this.marshalled_acl,
      onResponseHook: this.onResponseHook,
      create_unique_subscription: this.create_unique_subscription,
      active: this.active,
      cache_consistency_id: this.cache_consistency_id,
      serviced_by: this.serviced_by,
      id
    } = subscriptionRequest);
    this.owner_id = subscriptionRequest.owner_id ?? '';
    if (!id) {
      throw new Error('Must have an id!');
    }
    this.id = id.toString();

    this.executionContext = QueuedSubscription.validateSubscriptionRequest(this.schema, this);
  }
  /**
   * static so it can be used to validate subscriptions at the point of API
   * Note: Does not validate that the queryAttibutes are valid.
   *
   * @param schema
   * @param subscriptionRequest
   */
  static validateSubscriptionRequest(
    schema: GraphQLSchema,
    subscriptionRequest: IQueuedSubscriptionRequest
  ): GqlExecutionParams {
    // parse will throw an error if there are any parse errors
    const gqlDocument = parse(subscriptionRequest.gql_query_string ?? '');
    const executionParams: GqlExecutionParams = { query: gqlDocument };

    if (!isASubscriptionOperation(gqlDocument, subscriptionRequest.operation_name)) {
      throw new Error('query for subscription must be a graphql subscription');
    }

    const errors = validate(schema, gqlDocument, specifiedRules);
    if (errors.length) {
      // todo add explict tracing
      throw new Error(errors.toString());
    }

    if (subscriptionRequest.query_attributes) {
      // will throw if invalid
      executionParams.variables = JSON.parse(subscriptionRequest.query_attributes);
    }
    executionParams.operationName = subscriptionRequest.operation_name;
    return executionParams;
  }

  /**
   * publishes repsononses to the QueuedSubscriptionRequest
   */
  @AddToTrace()
  async publishResponse(ctx: RumbleshipContext, response: SubscriptionResponse): Promise<string> {
    ctx.beeline.addTraceContext({
      response,
      pubsub: { projectId: this.googlePublisher.projectId }
    });
    const subscription_name = this.subscription_name ?? '';
    const message: QueuedSubscriptionMessage = {
      owner_id: this.owner_id ?? '',
      subscription_name,
      subscription_id: this.id.toString(),
      subscription_response: response
    };
    const topic = await this.getTopic(ctx);
    ctx.beeline.addTraceContext({
      topic: { name: topic.name },
      subscription: { name: subscription_name, id: message.subscription_id }
    });
    const payload = JSON.stringify(message);
    return topic.publish(Buffer.from(payload));
  }

  @AddToTrace()
  protected async getTopic(ctx: RumbleshipContext): Promise<Topic> {
    if (!this._topic) {
      this._topic = await gcpGetTopic(this.googlePublisher, this.publish_to_topic_name);
    }
    return this._topic;
  }
  async start(): Promise<void> {
    // The subscribe function returns a long lived AsyncIterable
    // So rather than just having a standard RumbleshipContext
    // we create a 'resetable' context that wraps a real context.
    // the real context is then created on demand, and released on 'reset'.
    // We want this context to have the rights (ACL claims) that the original requester has
    // so we pass in the marshalled ACL that was saved on the original subscribe request
    const onDemandContext = new OnDemandRumbleshipContext(
      this.marshalled_acl,
      // if queued we want to share the subscription, otherwise we want unique subscriptons for each instance
      // it is a bit ugly, as we have to use the context to pass this option through the underlying libraries until
      // we ge to the bit that actually makes the subscriptions
      // see 'withQueuedSupport()'
      this.create_unique_subscription ? false : true
    );

    try {
      const result = await subscribe({
        schema: this.schema,
        document: this.executionContext.query,
        variableValues: this.executionContext.variables,
        operationName: this.executionContext.operationName,
        contextValue: onDemandContext
      });
      const logger = onDemandContext.logger;
      await onDemandContext.reset();
      if ('next' in result) {
        this.activeSubscription = result;
        for await (const executionResult of this.activeSubscription) {
          // NOTE we are inside a for await
          await RumbleshipBeeline.runWithoutTrace(async () => {
            await this.onGqlSubscribeResponse(onDemandContext, executionResult);
            await onDemandContext.reset();
          });
        }

        logger.info(`exited QueuedSubscription: ${this.subscription_name} `);
      } else {
        const error_payload = { errors: result };
        const error_message = `Error trying to subscribe to: ${
          this.subscription_name
        }: ${JSON.stringify(error_payload, undefined, 2)} `;
        onDemandContext.beeline.addTraceContext({
          'error.name': 'QueuedSubscriptionError',
          'error.message': 'Error trying to subscribe',
          'error.subscription_name': this.subscription_name,
          'error.owner_id': this.owner_id,
          'error.errors': result
        });
        const error = new Error(error_message);
        throw error;
      }
    } finally {
      await onDemandContext.reset();
    }
  }

  @AddToTrace()
  async onGqlSubscribeResponse(
    ctx: RumbleshipContext,
    executionResult: ExecutionResult
  ): Promise<void> {
    ctx.beeline.addTraceContext({
      pubsub: {
        projectId: this.googlePublisher.projectId,
        subscription: { name: this.subscription_name },
        topic: { name: this.publish_to_topic_name }
      },
      executionResult
    });
    if (this.publish_to_topic_name.length) {
      try {
        await this.publishResponse(ctx, executionResult);
      } catch (error) {
        addErrorToTraceContext(ctx, error);
        ctx.logger.error(error);
      }
    }
    if (this.onResponseHook) {
      await this.onResponseHook(executionResult);
    }
  }

  async stop(): Promise<void> {
    // force the iterator to finish
    if (this.activeSubscription?.return) {
      await this.activeSubscription.return();
    }
  }
}
