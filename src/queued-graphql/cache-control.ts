import { deserialize, serialize } from 'class-transformer';
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 *
 *
 */

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
import { getSequelizeInstance } from '../app';
import { QueuedSubscriptionCache } from './queued-subscription-cache';

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

  @Column(DataType.TEXT)
  get cache(): QueuedSubscriptionCache {
    return deserialize(QueuedSubscriptionCache, this.getDataValue('cache') as any);
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

export async function loadCache(): Promise<QueuedSubscriptionCache> {
  const sequelize = getSequelizeInstance();
  if (sequelize) {
    if (!sequelize.model(QsrLocalCacheModel)) {
      sequelize.addModels([QsrLocalCacheModel]);
    }
    // do we have a table in place?
    try {
      await QsrLocalCacheModel.sync();
    } catch (error) {
      // try creating the table
      await QsrLocalCacheModel.sync({ force: true });
    }
    const qsrCache = await QsrLocalCacheModel.findOne({});
    if (qsrCache) {
      return qsrCache.cache;
    } else {
      return new QueuedSubscriptionCache();
    }
  }
  throw new Error('sequelize not initialized');
}

export async function saveCache(cache: QueuedSubscriptionCache): Promise<void> {
  const sequelize = getSequelizeInstance();
  if (sequelize) {
    const transaction = await sequelize.transaction();
    const qsrCache = await QsrLocalCacheModel.findOne({ transaction });
    if (qsrCache) {
      qsrCache.cache = cache;
      await qsrCache.save();
      return;
    }
  }
  throw new Error('Invalid sequelize or cache must be loaded before saving');
}
