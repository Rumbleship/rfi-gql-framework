import { Service } from 'typedi';
// tslint:disable-next-line: no-circular-imports
import { SequelizeBaseService } from '../../../db/service/sequelize-base.service';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import { NodeServiceOptions, NodeServiceLock } from '../../../gql/relay/relay.interface';

import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { IGcpConfig, ISharedSchema } from '@rumbleship/config';

import {
  Webhook,
  WebhookEdge,
  WebhookConnection,
  WebhookFilter,
  WebhookInput,
  WebhookUpdate,
  WebhookService
} from '../gql/webhook.relay';
import { WebhookModel } from './webhook.model';

import { Actions, RFIAuthError } from '@rumbleship/acl';
import { Oid } from '@rumbleship/oid';
import {
  QueuedSubscriptionRequest,
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestEdge,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequestInput,
  QueuedSubscriptionRequestServiceSequelize
} from '../../queued_subscription_request';
import {
  gcpCreatePushSubscription,
  gcpGetTopic
} from '../../../queued-subscription-server/helpers/gcp_helpers';

import { ServicePermissions } from '../../permissions';

@Service() // Each Request gets its own instance
export class WebhookServiceSequelize
  extends SequelizeBaseService<
    Webhook,
    WebhookModel,
    WebhookEdge,
    WebhookConnection,
    WebhookFilter,
    WebhookInput,
    WebhookUpdate,
    any
  >
  implements WebhookService {
  constructor(context: RumbleshipContext) {
    super(Webhook, WebhookEdge, WebhookConnection, WebhookModel, context, {
      permissions: ServicePermissions.Webhook
    });
  }
  async addWebhook(
    config: ISharedSchema,
    input: WebhookInput,
    opts: NodeServiceOptions
  ): Promise<Webhook> {
    if (
      this.can({
        action: Actions.CREATE,
        authorizable: input,
        options: opts
      })
    ) {
      const webhook = await this.addAuthorizationFiltersAndWrapWithTransaction(
        { opts: { ...opts, ...{ lockLevel: NodeServiceLock.UPDATE } } },
        async optionsWithTransactionAndAuth => {
          const pubSubConfig = config.PubSub;
          const gcpConfig = config.Gcp;

          const webhookRelay = await this.create(input, optionsWithTransactionAndAuth);
          const webhookUpdate = new WebhookUpdate();
          webhookUpdate.id = webhookRelay.id.toString();
          webhookUpdate.topic_name = `${pubSubConfig.topicPrefix}_${config.serviceName}webhooks_${
            webhookRelay.owner_id
          }_${webhookRelay.id.toString()}`;
          webhookUpdate.gcloud_subscription = webhookUpdate.topic_name;

          await this.createTopicAndSubscriptionForGooglePubSub(
            gcpConfig,
            webhookUpdate.topic_name,
            webhookUpdate.gcloud_subscription,
            webhookRelay.subscription_url
          );

          return await this.update(webhookUpdate, {
            ...optionsWithTransactionAndAuth,
            skipAuthorizationCheck: true
          });
        }
      );
      return webhook;
    }
    throw new RFIAuthError('Not Authorized!');
  }

  async removeWebhook(webhookId: string, opts: NodeServiceOptions): Promise<void> {
    return await this.addAuthorizationFiltersAndWrapWithTransaction(
      { opts: { ...opts, ...{ lockLevel: NodeServiceLock.UPDATE } } },
      async optionsWithTransactionAndAuth => {
        const webhook = await this.getOne(new Oid(webhookId), optionsWithTransactionAndAuth);
        const webhookModel = this.dbModelFromGql(webhook);
        // check that associated qsr is correctly managed
        await webhookModel.destroy({
          ...optionsWithTransactionAndAuth,
          ...{ skipAuthorizationCheck: true }
        });
      }
    );
  }

  async addSubscription(
    webhookId: string,
    input: QueuedSubscriptionRequestInput,
    opts: NodeServiceOptions
  ): Promise<QueuedSubscriptionRequest> {
    return await this.addAuthorizationFiltersAndWrapWithTransaction(
      { opts: { ...opts, ...{ lockLevel: NodeServiceLock.UPDATE } } },
      async optionsWithTransactionAndAuth => {
        // QSR's publish directly onto the google pubsub without
        // going through the pubsub derivation we use for the graphQl
        // websocket subscriptions or the listening for model changes...
        //

        const webhook = await this.getOne(new Oid(webhookId), optionsWithTransactionAndAuth);
        const qsrService = this.getServiceFor<
          QueuedSubscriptionRequest,
          QueuedSubscriptionRequestServiceSequelize
        >(QueuedSubscriptionRequest);

        input.publish_to_topic_name = webhook.topic_name;
        input.owner_id = webhook.owner_id;
        input.marshalled_acl = this.ctx.authorizer.marshalClaims();
        const qsrRelay = await qsrService.create(input, {
          ...optionsWithTransactionAndAuth,
          skipAuthorizationCheck: true
        });
        const webhookModel = this.dbModelFromGql(webhook);
        const qsrModel = qsrService.dbModelFromGql(qsrRelay);
        await webhookModel.$add('webhookSubscription', qsrModel, {
          ...optionsWithTransactionAndAuth,
          ...{ skipAuthorizationCheck: true }
        });
        return qsrService.gqlFromDbModel(qsrModel);
      }
    );
  }
  async removeSubscription(
    webhookId: string,
    subscriptionId: string,
    opts: NodeServiceOptions
  ): Promise<Webhook> {
    // deactivate the qsr subscription so no more events will be published
    // then delete it (paranoid is on, so we still have it)
    return await this.addAuthorizationFiltersAndWrapWithTransaction(
      { opts: { ...opts, ...{ lockLevel: NodeServiceLock.UPDATE } } },
      async optionsWithTransactionAndAuth => {
        const webhook = await this.getOne(new Oid(webhookId), optionsWithTransactionAndAuth);

        const qsrService = this.getServiceFor<
          QueuedSubscriptionRequest,
          QueuedSubscriptionRequestServiceSequelize
        >(QueuedSubscriptionRequest);

        // deactivate the qsr so all publishing will stop
        const qsrRelay = await qsrService.update(
          { id: subscriptionId, active: false },
          {
            ...optionsWithTransactionAndAuth,
            ...{ skipAuthorizationCheck: true }
          }
        );
        // then mark as deleted
        const qsrModel = qsrService.dbModelFromGql(qsrRelay);
        await qsrModel.destroy({
          ...optionsWithTransactionAndAuth,
          ...{ skipAuthorizationCheck: true }
        });
        return webhook;
      }
    );
  }
  async getWebhookSubscriptionsFor(
    aWebhook: Webhook,
    filter: Partial<QueuedSubscriptionRequestFilter>,
    opts: NodeServiceOptions
  ): Promise<QueuedSubscriptionRequestConnection> {
    return super.getAssociatedMany(
      aWebhook,
      'webhookSubscriptions',
      filter,
      QueuedSubscriptionRequest,
      QueuedSubscriptionRequestEdge,
      QueuedSubscriptionRequestConnection,
      opts
    );
  }

  private async createTopicAndSubscriptionForGooglePubSub(
    gcpConfig: IGcpConfig,
    topic_name: string,
    gcloud_subscription: string,
    subscription_url: string
  ): Promise<void> {
    const googlePubSub = new GooglePubSub(gcpConfig.Auth);
    const topic = await gcpGetTopic(googlePubSub, topic_name);
    await gcpCreatePushSubscription(topic, gcloud_subscription, subscription_url);
  }
}
