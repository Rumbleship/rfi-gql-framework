import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { ISharedSchema } from '@rumbleship/config';

import { AddToTrace } from '@rumbleship/o11y';
import { print } from 'graphql';
import { ClassType } from '../../../helpers';
import { RumbleshipContext } from '../../../app/rumbleship-context';
import { QueuedSubscriptionMessage } from '../../servers';
import { RfiPubSubSubscription } from '../../shared';
import { QueuedGqlRequestClientSingleInstanceResponder } from '../gql-request/queued-gql-request-client';
import { syncQsrGql, syncQsrVariables } from './sync_qsr.interface';
import {
  getQsoHandlers,
  QueuedSubscriptionHandler,
  QueuedSubscriptionObserverMetadata
} from './q_s_observer';

/**
 * Each service has its own pubsub topic that subscription responses are sent to. We subscribe to this
 * topic using a 'service' subscription (ie each message is handled by a single instance)
 *
 * On initialization, we send out all the QSR's defined in the observers on a createOrUpdate mutation to
 * ensure that the Qsr Managament service has the latest version of a Qsr and the responding service is updated
 *
 */
export class QueuedSubscriptionObserverManager {
  qsr_subscription: RfiPubSubSubscription<QueuedSubscriptionMessage>;
  qsrTopicName: string;
  qsrSubscriptionName: string;
  handlers: Map<string, QueuedSubscriptionHandler> = new Map();
  _initialized = false;
  queuedGqlRequestClient: QueuedGqlRequestClientSingleInstanceResponder;
  constructor(
    public config: ISharedSchema,
    protected observers: readonly ClassType<Record<string, any>>[]
  ) {
    const pubsub = new GooglePubSub(this.config.Gcp.Auth);
    pubsub.projectId = pubsub.projectId.replace('-private', '-public');
    this.qsrTopicName = `${this.config.PubSub.topicPrefix}_QSR_PUBLISH_TO.${config.serviceName}`;
    // Only one instance of the service listens to this...But each version of the service live has its own subscription
    // this ensures that if a new QueuedSubscription is live, any versions trhat are live will all get the mesage
    // and are free to discard
    this.qsrSubscriptionName = `${this.qsrTopicName}.${config.Gcp.gaeVersion}`;
    // define the gcloud topic and subscription to observe (all qsrs for *this* service use the same topic)
    this.qsr_subscription = new RfiPubSubSubscription<QueuedSubscriptionMessage>(
      config,
      pubsub,
      this.qsrTopicName,
      this.qsrSubscriptionName,
      false
      // @todo(isaac): Consider ramifications of enabling this. Should be zero, but...
      // {
      //   enableOpenTelemetryTracing: true
      // }
    );
    this.queuedGqlRequestClient = new QueuedGqlRequestClientSingleInstanceResponder(config);
  }
  setHandlers(observers: readonly ClassType<Record<string, any>>[]): void {
    this.handlers = new Map(
      observers
        .map(observer => getQsoHandlers(observer))
        .flat()
        .map(handler => [handler.qso_metadata.subscription_name, handler])
    );
  }
  @AddToTrace()
  async init(ctx: RumbleshipContext): Promise<void> {
    this.setHandlers(this.observers);
    await this.qsr_subscription.init();
    await this.syncQsrs(ctx);
    this._initialized = true;
  }

  /**
   * This function takes all the decorated Qso metadata and creates
   * QSR definitions that are then sent to the qsr system if then are new,
   * they are created, if needed they are updated.
   *
   * Any change will be broadcast to all the Qsr's services and the running
   * QSR will be updated or created
   */
  @AddToTrace()
  async syncQsrs(ctx: RumbleshipContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void this.queuedGqlRequestClient.start();

    for (const handler of this.handlers.values()) {
      await this.syncQsr(ctx, handler.qso_metadata);
    }
  }

  @AddToTrace()
  async syncQsr(
    ctx: RumbleshipContext,
    qso_metadata: QueuedSubscriptionObserverMetadata
  ): Promise<void> {
    const client_request_id = `${this.config.serviceName}.syncQsrs`;
    const marshalled_acl = ctx.authorizer.marshalClaims();
    const owner_id = ctx.authorizer.getUser();
    const gql_query_string =
      typeof qso_metadata.gql_document === 'string'
        ? qso_metadata.gql_document
        : print(qso_metadata.gql_document);
    const queryAttributes: syncQsrVariables = {
      subscription_name: qso_metadata.subscription_name,
      gql_query_string,
      operation_name: qso_metadata.operation_name,
      active: qso_metadata.active,
      marshalled_acl: marshalled_acl,
      owner_id: owner_id,
      publish_to_topic_name: this.qsrTopicName,
      query_attributes: qso_metadata.query_attributes
    };
    ctx.beeline.addTraceContext({ qso: queryAttributes });
    // we dont care about the response, so let default do nothing handler act
    await this.queuedGqlRequestClient.makeRequest(ctx, {
      client_request_id,
      respond_on_error: false,
      gql_query_string: print(syncQsrGql),
      query_attributes: JSON.stringify(queryAttributes)
    });
  }

  @AddToTrace()
  async start(ctx: RumbleshipContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void this.qsr_subscription.start(
      (ctx: RumbleshipContext, message: QueuedSubscriptionMessage): Promise<void> => {
        return this.message_dispatcher(ctx, message);
      }
    );
  }
  @AddToTrace()
  async stop(ctx: RumbleshipContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void this.qsr_subscription?.stop();
    void this.queuedGqlRequestClient?.stop();
  }

  /**
   *
   * @param ctx
   * @param response
   */
  @AddToTrace()
  async message_dispatcher(
    ctx: RumbleshipContext,
    message: QueuedSubscriptionMessage
  ): Promise<void> {
    // Same service, different versions means a domain model changes originated from a different
    // running version of self; we filter these messages out to enable blue/green deploys.
    if (
      message.publisher_service_name === this.config.serviceName &&
      message.publisher_version !== this.config.Gcp.gaeVersion
    ) {
      return;
    }
    ctx.beeline.addTraceContext({
      message
    });
    const handler = this.handlers.get(message.subscription_name);
    if (handler && handler.observer_class) {
      const observer = ctx.container.get(handler.observer_class);
      const hndlr = handler.handler.bind(observer);
      return hndlr(ctx, message);
    }
  }
}
