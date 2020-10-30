import { PubSub as GooglePubSub } from '@google-cloud/pubsub';

import { ISharedSchema } from '@rumbleship/config';
import { AddToTrace } from '@rumbleship/o11y';
import { forcePublicProjectPubsub } from '../../../helpers/pubsub-auth-project';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { gcpGetTopic } from '../../helpers';
import {
  IQueuedGqlRequest,
  IQueuedGqlResponse
} from '../../interfaces/queued-gql-request.interface';
import {
  QUEUED_GRAPHQL_REQUEST_TOPIC,
  QUEUED_GRAPHQL_RESPONSE_TOPIC
} from '../../interfaces/topic_manifest_constants';
import { RfiPubSubSubscription } from '../../shared/rfi-pubsub-subscription';

/**
 * Creates a client to send and listen for reposnes over the 'queue (eg google pubsub)
 * 
 * This can be a bit subtle, and there are differnet Clients for different use-cases:
 *  
    class QueuedGqlRequestClientOneInstanceResponder a request is sent out by one instance, and any one instance of the app 
    will receive the response.

      This is useful when the code to make a request is disconnected from the response and the responding code can eitehr get 
      context via a persistent state in the shared database, or it can respond effectively without knowing the specific request details.

      The subscription that is created in this case is tied to the service name, not a specific instance, so if the service is not running when the 
      response sent, the pubsub infra will wait till it is up before delivering.

      THis makes for a robust service to service communication, as the the service that the request is being made to can be not present 
      when the request is made as well

      Some care is in order when cosidering promotion of versions as a request may of been made and a new vedrsion of the app is loaded
      before the response is received...

      A handler is set for each 'client_request_id' and will be typically the 
 * 
 */
export class QueuedGqlRequestClientSingleInstanceResponder {
  public request_topic_name: string;
  public response_topic_name: string;
  public response_subscription_name: string;
  public service_name: string;

  protected _client_id_handler_map: Map<
    string,
    (ctx: RumbleshipContext, response: IQueuedGqlResponse) => Promise<void>
  > = new Map();
  protected _response_subscription: RfiPubSubSubscription<IQueuedGqlResponse>;
  protected _pubsub: GooglePubSub;
  constructor(public config: ISharedSchema) {
    // this is a 'global' topic that all services who can respond to a graphql request listens to
    this.request_topic_name = `${config.PubSub.topicPrefix}${QUEUED_GRAPHQL_REQUEST_TOPIC}`;
    this.service_name = config.serviceName;
    // we have a topic defined for each service for responses to be published to
    this.response_topic_name = `${config.PubSub.topicPrefix}${QUEUED_GRAPHQL_RESPONSE_TOPIC}_${this.service_name}`;
    // And a single subscription for each service to listen to that topic
    this.response_subscription_name = `${this.response_topic_name}.${config.Gcp.gaeVersion}`;
    this._pubsub = new GooglePubSub(forcePublicProjectPubsub(config.Gcp.Auth));
    this._response_subscription = new RfiPubSubSubscription(
      config,
      this._pubsub,
      this.response_topic_name,
      this.response_subscription_name,
      false
    );
  }

  @AddToTrace()
  async makeRequest(
    ctx: RumbleshipContext,
    params: Pick<
      IQueuedGqlRequest,
      | 'client_request_id'
      | 'respond_on_error'
      | 'gql_query_string'
      | 'query_attributes'
      | 'operation_name'
    >,
    onResponsehandler?: (ctx: RumbleshipContext, response: IQueuedGqlResponse) => Promise<void>
  ): Promise<string> {
    if (onResponsehandler) {
      this.onResponse({ client_request_id: params.client_request_id, handler: onResponsehandler });
    }
    const request: IQueuedGqlRequest = {
      ...params,
      publish_to_topic_name: this.response_topic_name,
      marshalled_acl: ctx.authorizer.marshalClaims(),
      owner_id: ctx.authorizer.getUser()
    };

    const topic = await gcpGetTopic(this._pubsub, this.request_topic_name);
    const payload = JSON.stringify(request);
    return topic.publish(Buffer.from(payload));
  }
  async start(): Promise<void> {
    await this._response_subscription.init();
    await this._response_subscription.start(
      async (ctx: RumbleshipContext, response: IQueuedGqlResponse): Promise<void> => {
        const handler = this._client_id_handler_map.get(response.client_request_id);
        if (handler) {
          return handler(ctx, response);
        } else {
          return this.defaultHandler(ctx, response);
        }
      },
      this.constructor.name
    );
  }

  @AddToTrace()
  async defaultHandler(ctx: RumbleshipContext, response: IQueuedGqlResponse): Promise<void> {
    return;
  }

  async stop(): Promise<void> {
    return this._response_subscription.stop();
  }
  onResponse(params: {
    client_request_id: string;
    handler: (ctx: RumbleshipContext, response: IQueuedGqlResponse) => Promise<void>;
  }): void {
    this._client_id_handler_map.set(params.client_request_id, params.handler);
  }

  stopResponding(params: { client_request_id: string }): void {
    this._client_id_handler_map.delete(params.client_request_id);
  }
}
