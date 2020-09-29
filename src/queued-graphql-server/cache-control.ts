import { deserializeArray } from "class-transformer";
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 * 
 * 
 */

import { AutoIncrement, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";
import { IQueuedSubscriptionRequest } from "./queued-subscription/queued-subscription-request.interface";


export class CachedQueuedSubscription implements IQueuedSubscriptionRequest {
  owner_id: string;
  gql_query_string?: string;
  query_attributes?: string;
  operation_name?: string;
  publish_to_topic_name: string;
  subscription_name?: string;
  marshalled_acl: string;
  active?: boolean;
  id: string;
  

}


@Table({
  timestamps: true,
  paranoid: false,
  underscored: true,
  tableName: 'qsr_local_cache'
})
class QsrLocalCacheModel extends Model<QsrLocalCacheModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;



  @Column
  cache_hash!: string;

  @Column(DataType.TEXT)
  get cache_contents():  IQueuedSubscriptionRequest[] {
    return deserializeArray(this.getDataValue('cache_contents'));
  }
  set cache_contents( active_subscriptions: IQueuedSubscriptionRequest[]) {

  }

  // Need to force the use of underscored for the timestamps
  @CreatedAt
  created_at?: Date;
  @UpdatedAt
  updated_at?: Date;
  
}

 export async function save