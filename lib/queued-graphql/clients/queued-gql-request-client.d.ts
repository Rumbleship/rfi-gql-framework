import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { ISharedSchema } from '@rumbleship/config';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { IQueuedGqlRequest, IQueuedGqlResponse } from '../interfaces/queued-gql-request.interface';
import { RfiPubSubSubscription } from '../shared/rfi-pubsub-subscription';
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
export declare class QueuedGqlRequestClientOneInstanceResponder {
    config: ISharedSchema;
    request_topic_name: string;
    response_topic_name: string;
    response_subscription_name: string;
    service_name: string;
    protected _client_id_handler_map: Map<string, (response: IQueuedGqlResponse, ctx: RumbleshipContext) => Promise<void>>;
    protected _response_subscription: RfiPubSubSubscription<IQueuedGqlResponse>;
    protected _pubsub: GooglePubSub;
    constructor(config: ISharedSchema);
    makeRequest(ctx: RumbleshipContext, params: Pick<IQueuedGqlRequest, 'client_request_id' | 'respond_on_error' | 'gql_query_string' | 'query_attributes' | 'operation_name'>): Promise<string>;
    start(): Promise<void>;
    stop(): Promise<void>;
    onResponse(params: {
        client_request_id: string;
        handler: (response: IQueuedGqlResponse, ctx: RumbleshipContext) => Promise<void>;
    }): void;
    stopResponding(params: {
        client_request_id: string;
    }): void;
}
