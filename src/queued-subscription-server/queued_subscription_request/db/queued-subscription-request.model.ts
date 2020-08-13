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
  AutoIncrement
} from 'sequelize-typescript';
import { validateFromExemplar } from '../../../db/helpers/validate-from-exemplar';
import { AttribType } from '../../../gql/relay/attrib.enum';

import { buildQueuedSubscriptionRequestBaseAttribs } from '../gql/queued-subscription-request.relay';

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

  @AfterValidate
  static afterValidateHook(instance: QueuedSubscriptionRequestModel, options: any): void {
    validateFromExemplar(instance, QueuedSubscriptionRequestValidator);
  }
}
