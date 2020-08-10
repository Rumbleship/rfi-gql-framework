import {
  GraphQLSchema,
  ExecutionResult,
  subscribe,
  parse,
  specifiedRules,
  validate
} from 'graphql';
import { GqlExecutionParams } from './gql-execution-params';
import { OnDemandRumbleshipContext } from '../app/rumbleship-context/on-demand-rumbleship-context';
import {
  IQueuedSubscriptionRequest,
  SubscriptionResponse
} from './queued_subscription_request/queued_subscription_request';
import { isASubscriptionOperation } from './is_subscription_operation';
import { PubSub as GooglePubSub, Topic } from '@google-cloud/pubsub';
import { IGcpConfig } from '@rumbleship/config';

interface QueuedSubscriptionMessage {
  service_id: string;
  clientRequestUuid: string;
  subscriptionId: string;
  subscriptionResponse: SubscriptionResponse;
}
export class QueuedSubscription implements IQueuedSubscriptionRequest {
  activeSubscription?: AsyncIterableIterator<
    ExecutionResult<{
      [key: string]: any;
    }>
  >;
  executionContext: GqlExecutionParams;
  authorized_requestor_id: string;
  gql_query_string: string;
  query_attributes?: string;
  operation_name?: string;
  publish_to_topic_name: string;
  client_request_uuid: string;
  marshalled_acl: string;
  active: boolean;
  onResponseHook?: (response: SubscriptionResponse) => Promise<void>;
  create_unique_subscription?: boolean;
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
    // This object is a very longlived 'active' object, so we dont want to have
    // any unexpected side-effects of holding relay objects in memory and the
    // potential for large networks of objects and services never being garbage collected
    //
    //
    let id;
    ({
      authorized_requestor_id: this.authorized_requestor_id,
      gql_query_string: this.gql_query_string,
      query_attributes: this.query_attributes,
      operation_name: this.operation_name,
      publish_to_topic_name: this.publish_to_topic_name,
      client_request_uuid: this.client_request_uuid,
      marshalled_acl: this.marshalled_acl,
      onResponseHook: this.onResponseHook,
      create_unique_subscription: this.create_unique_subscription,
      active: this.active,
      id
    } = subscriptionRequest);
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
    const gqlDocument = parse(subscriptionRequest.gql_query_string);
    const executionParams: GqlExecutionParams = { query: gqlDocument };

    if (!isASubscriptionOperation(gqlDocument, subscriptionRequest.operation_name)) {
      throw new Error('query for subscription must be a graphql subscription');
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

  /**
   * publishes repsononses to the QueuedSubscriptionRequest
   */
  async publishResponse(response: SubscriptionResponse) {
    const message: QueuedSubscriptionMessage = {
      service_id: this.authorized_requestor_id,
      clientRequestUuid: this.client_request_uuid,
      subscriptionId: this.id.toString(),
      subscriptionResponse: response
    };
    const topic = await this.getTopic();
    const payload = JSON.stringify(message);
    return topic.publish(Buffer.from(payload));
  }

  protected async getTopic(): Promise<Topic> {
    if (!this._topic) {
      let topic = this.googlePublisher.topic(this.publish_to_topic_name);
      const [exists] = await topic.exists();
      if (!exists) {
        try {
          [topic] = await this.googlePublisher.createTopic(this.publish_to_topic_name);
        } catch (e) {
          const TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER = 6;
          if (e.code === TOPIC_ALREADY_EXISTS_GCP_MAGIC_NUMBER) {
            // It can be created during a race condition,
            // so try again
            topic = this.googlePublisher.topic(this.publish_to_topic_name);
          } else {
            throw e;
          }
        }
      }
      this._topic = topic;
    }
    return this._topic;
  }
  async start() {
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
      if ('next' in result) {
        this.activeSubscription = result;
        for await (const executionResult of this.activeSubscription) {
          logger.info(`contextid: ${onDemandContext.id}: Ready to send Subscription response for ${
            this.client_request_uuid
          } to ${this.publish_to_topic_name}: 
        ${JSON.stringify(executionResult, undefined, 2)}`);
          if (this.publish_to_topic_name.length) {
            await this.publishResponse(executionResult);
          }
          if (this.onResponseHook) {
            await this.onResponseHook(executionResult);
          }
          await onDemandContext.reset();
        }
        logger.info(`exited QueuedSubscription: ${this.client_request_uuid} `);
      } else {
        const error_payload = { errors: result };
        const error_message = `Error trying to subscribe to: ${
          this.client_request_uuid
        }: ${JSON.stringify(error_payload, undefined, 2)} `;

        logger.error(error_message);
        throw new Error(error_message);
      }
    } finally {
      await onDemandContext.reset();
    }
  }

  async stop() {
    // force the iterator to finish
    if (this.activeSubscription?.return) {
      await this.activeSubscription.return();
    }
  }
}
