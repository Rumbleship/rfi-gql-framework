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
  HasMany
} from 'sequelize-typescript';
import { validateFromExemplar } from '../../../db/helpers/validate-from-exemplar';
import { AttribType } from '../../../gql/relay/attrib.enum';
import { buildWebhookBaseAttribs } from '../gql/webhook.attribs';

// eslint-disable-next-line import/no-cycle
import { QueuedSubscriptionRequestModel } from './queued-subscription-request.model';

const WebhookValidator = class extends buildWebhookBaseAttribs(AttribType.ValidateOnly) {};

@Table({
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'webhooks'
})
export class WebhookModel extends Model<WebhookModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column
  division_id!: string;

  @Column(DataType.TEXT)
  subscription_url!: string;

  @Column(DataType.TEXT)
  subscription_name!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  active!: string;

  @HasMany(() => QueuedSubscriptionRequestModel)
  webhookSubscriptions?: [QueuedSubscriptionRequestModel];

  // Need to force the use of underscored for the timestamps
  @CreatedAt
  created_at?: Date;
  @UpdatedAt
  updated_at?: Date;
  @DeletedAt
  deleted_at?: Date;

  @AfterValidate
  static afterValidateHook(instance: WebhookModel, options: unknown): void {
    validateFromExemplar(instance, WebhookValidator);
  }
}
