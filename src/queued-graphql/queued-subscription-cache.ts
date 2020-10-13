import { deserialize, Exclude, Expose, plainToClass, serialize, Type } from 'class-transformer';

import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';

import { getSequelizeInstance } from '../app/server/init-sequelize';
import { IQueuedSubscriptionRequest } from './servers/queued-subscription/queued-subscription-request.interface';
import { Oid } from '@rumbleship/oid';

@Exclude() // only persist the Exposed...
export class PersistableQueuedSubscription implements IQueuedSubscriptionRequest {
  @Expose() cache_consistency_id!: number;
  @Expose() owner_id!: string;
  @Expose() gql_query_string?: string;
  @Expose() query_attributes?: string;
  @Expose() operation_name?: string;
  @Expose() publish_to_topic_name!: string;
  @Expose() subscription_name?: string;
  @Expose() marshalled_acl!: string;
  @Expose() active?: boolean;
  @Expose() id!: string;
  @Expose() serviced_by!: string[];
}
@Exclude() // only persist the Exposed...
export class QueuedSubscriptionCache {
  @Expose() highest_cache_consistency_id = 0;

  @Expose() version = ''; // string representing the version of the app that saved the cache. Typically google_version

  // to work around a wierd class transformer defect ( https://github.com/typestack/class-transformer/issues/489)
  @Type(() => PersistableQueuedSubscription)
  @Expose()
  get _cache(): IQueuedSubscriptionRequest[] {
    return Array.from(this._cache_map.values());
  }
  set _cache(requestArray: IQueuedSubscriptionRequest[]) {
    this.clear();
    this.add(requestArray);
  }

  _cache_map: Map<string, IQueuedSubscriptionRequest> = new Map();
  get cache(): Map<string, IQueuedSubscriptionRequest> {
    return this._cache_map;
  }
  set cache(cache: Map<string, IQueuedSubscriptionRequest>) {
    this._cache_map = cache;
  }
  constructor(version?: string) {
    if (version) {
      this.version = version;
    }
  }
  clear(): void {
    this._cache_map.clear();
    this.highest_cache_consistency_id = 0;
  }
  add(qsrs: IQueuedSubscriptionRequest[]): void {
    if (!Array.isArray(qsrs)) {
      throw new Error('Must be an array of Qsrs');
    }
    const persistable_qsrs = plainToClass(PersistableQueuedSubscription, qsrs, {
      excludeExtraneousValues: true
    });
    for (const qsr of persistable_qsrs) {
      this._cache_map.set(qsr.id, qsr);
    }
  }
}

export const QsrCacheOidScope = 'QsrCache';

// we just do this here, as it is
Oid.RegisterScope(QsrCacheOidScope, QsrCacheOidScope);
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 *
 *
 */

@Table({
  timestamps: true,
  paranoid: false,
  underscored: true,
  tableName: 'qsr_local_cache'
})
export class QsrLocalCacheModel extends Model<QsrLocalCacheModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column(DataType.TEXT({ length: 'long' }))
  get cache(): QueuedSubscriptionCache {
    const cache = deserialize(QueuedSubscriptionCache, this.getDataValue('cache') as any);

    return cache;
  }
  set cache(active_subscriptions: QueuedSubscriptionCache) {
    const subs_json = serialize(active_subscriptions);
    this.setDataValue('cache', subs_json as any);
  }
  // Need to force the use of underscored for the timestamps
  @CreatedAt
  created_at?: Date;
  @UpdatedAt
  updated_at?: Date;
}

export async function loadCache(
  version: string,
  opts?: {
    transaction?: Transaction;
  }
): Promise<QueuedSubscriptionCache> {
  const sequelize = getSequelizeInstance();
  if (sequelize) {
    try {
      sequelize.model('QsrLocalCacheModel');
    } catch (error) {
      sequelize.addModels([QsrLocalCacheModel]);
    }
    // do we have a table in place?
    try {
      await QsrLocalCacheModel.sync();
    } catch (error) {
      // try creating the table
      await QsrLocalCacheModel.sync({ force: true });
    }
    let qsrCache = await QsrLocalCacheModel.findOne({
      transaction: opts?.transaction,
      lock: opts?.transaction ? true : undefined
    });
    if (!qsrCache) {
      qsrCache = await QsrLocalCacheModel.create(
        { cache: new QueuedSubscriptionCache(version) },
        { transaction: opts?.transaction }
      );
    } else {
      if (version !== qsrCache.cache.version) {
        qsrCache = await qsrCache.update(
          { cache: new QueuedSubscriptionCache(version) },
          { transaction: opts?.transaction }
        );
      }
    }
    return qsrCache.cache;
  }
  throw new Error('sequelize not initialized');
}

export async function saveCache(
  cache: QueuedSubscriptionCache,
  opts: {
    transaction: Transaction;
  }
): Promise<void> {
  const qsrCache = await QsrLocalCacheModel.findOne({ transaction: opts.transaction, lock: true });
  if (qsrCache) {
    qsrCache.cache = cache;
    await qsrCache.save({ transaction: opts?.transaction });
    return;
  }

  throw new Error('Invalid sequelize or cache must be loaded before saving');
}
