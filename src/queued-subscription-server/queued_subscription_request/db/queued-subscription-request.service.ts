import { Service } from 'typedi';
// tslint:disable-next-line: no-circular-imports
import { SequelizeBaseService } from '../../../db/service/sequelize-base.service';
import { RumbleshipContext } from '../../../app/rumbleship-context/rumbleship-context';
import {
  NodeServiceOptions,
  NodeServiceLock,
  NodeServiceIsolationLevel
} from '../../../gql/relay/relay.interface';

import {
  QueuedSubscriptionRequest,
  QueuedSubscriptionRequestEdge,
  QueuedSubscriptionRequestConnection,
  QueuedSubscriptionRequestFilter,
  QueuedSubscriptionRequestInput,
  QueuedSubscriptionRequestUpdate,
  QueuedSubscriptionRequestService
} from '../gql/queued-subscription-request.relay';
import { QueuedSubscriptionRequestModel } from './queued-subscription-request.model';
import { ServicePermissions } from '../permissions';
import { Webhook } from '../gql/webhook.relay';

@Service() // Each Request gets its own instance
export class QueuedSubscriptionRequestServiceSequelize
  extends SequelizeBaseService<
    QueuedSubscriptionRequest,
    QueuedSubscriptionRequestModel,
    QueuedSubscriptionRequestEdge,
    QueuedSubscriptionRequestConnection,
    QueuedSubscriptionRequestFilter,
    QueuedSubscriptionRequestInput,
    Partial<QueuedSubscriptionRequestUpdate>,
    any
  >
  implements QueuedSubscriptionRequestService {
  constructor(context: RumbleshipContext) {
    super(
      QueuedSubscriptionRequest,
      QueuedSubscriptionRequestEdge,
      QueuedSubscriptionRequestConnection,
      QueuedSubscriptionRequestModel,
      context,
      {
        permissions: ServicePermissions.QueuedSubscriptionRequest
      }
    );
  }
  async createAndCommit(
    queuedSubscriptionRequestInput: QueuedSubscriptionRequestInput
  ): Promise<void> {
    const transaction = await this.newTransaction({
      isolation: NodeServiceIsolationLevel.READ_COMMITTED,
      autocommit: false
    });
    try {
      this.ctx.logger.info('QueuedSubscriptionRequest:create_and_commit:start', {
        QueuedSubscriptionRequestInput
      });
      const opts: NodeServiceOptions = {
        transaction,
        lockLevel: NodeServiceLock.UPDATE
      };
      await this.create(queuedSubscriptionRequestInput, opts);
      await transaction.commit();
      this.ctx.logger.info('QueuedSubscriptionRequest:create_and_commit:end', {
        QueuedSubscriptionRequestInput
      });
    } catch (e) {
      this.ctx.logger.error(e);
      this.ctx.logger.error('QueuedSubscriptionRequest:create_and_commit:exception', {
        QueuedSubscriptionRequestInput,
        exception: {
          stack: e.stack,
          message: e.message
        }
      });
      await transaction.rollback();
      throw e;
    }
  }

  async getWebhookFor(
    aQsr: QueuedSubscriptionRequest,
    opts: NodeServiceOptions
  ): Promise<Webhook | undefined> {
    return super.getAssociated(aQsr, 'webhook', Webhook, opts);
  }
}
