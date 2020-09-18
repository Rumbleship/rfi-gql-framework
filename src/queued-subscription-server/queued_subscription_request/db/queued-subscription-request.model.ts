import {
  Model,
  Column,
  PrimaryKey,
  Table,
  DataType,
  AfterValidate,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { validateFromExemplar } from '../../../db/helpers/validate-from-exemplar';
import { AttribType } from '../../../gql/relay/attrib.enum';

// eslint-disable-next-line import/no-cycle
import { buildQueuedSubscriptionRequestBaseAttribs } from '../gql/queued-subscription-request.relay';
// eslint-disable-next-line import/no-cycle
import { WebhookModel } from '../../webhook/db/webhook.model';

const QueuedSubscriptionRequestValidator = class extends buildQueuedSubscriptionRequestBaseAttribs(
  AttribType.ValidateOnly
) {};

@Table({
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'queued_subscription_requests'
})
export class QueuedSubscriptionRequestModel extends Model<QueuedSubscriptionRequestModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column
  authorized_requestor_id!: string;

  @Column
  marshalled_acl!: string;

  @Column(DataType.TEXT) // 64k limit...
  gql_query_string!: string;

  @Column(DataType.TEXT)
  query_attributes?: string;

  @Column(DataType.TEXT)
  operation_name?: string;

  @Column(DataType.TEXT)
  publish_to_topic_name!: string;

  @Column
  client_request_uuid!: string;

  @Column(DataType.BOOLEAN)
  active!: boolean;
  // Need to force the use of underscored for the timestamps
  @CreatedAt
  created_at?: Date;
  @UpdatedAt
  updated_at?: Date;
  @DeletedAt
  deleted_at?: Date;

  @ForeignKey(() => WebhookModel)
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @BelongsTo(() => WebhookModel)
  webhook?: WebhookModel;

  @AfterValidate
  static afterValidateHook(instance: QueuedSubscriptionRequestModel, options: unknown): void {
    validateFromExemplar(instance, QueuedSubscriptionRequestValidator);
  }
}
