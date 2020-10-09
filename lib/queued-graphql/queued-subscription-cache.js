"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCache = exports.loadCache = exports.QsrCacheOidScope = exports.QueuedSubscriptionCache = exports.PersistableQueuedSubscription = void 0;
const class_transformer_1 = require("class-transformer");
const sequelize_typescript_1 = require("sequelize-typescript");
const init_sequelize_1 = require("../app/server/init-sequelize");
const oid_1 = require("@rumbleship/oid");
class PersistableQueuedSubscription {
}
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", Number)
], PersistableQueuedSubscription.prototype, "cache_consistency_id", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "owner_id", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "gql_query_string", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "query_attributes", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "operation_name", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "publish_to_topic_name", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "subscription_name", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "marshalled_acl", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", Boolean)
], PersistableQueuedSubscription.prototype, "active", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", String)
], PersistableQueuedSubscription.prototype, "id", void 0);
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", Array)
], PersistableQueuedSubscription.prototype, "serviced_by", void 0);
exports.PersistableQueuedSubscription = PersistableQueuedSubscription;
class QueuedSubscriptionCache {
    constructor() {
        this.highest_cache_consistency_id = 0;
        this.cache = new Map();
    }
    clear() {
        this.cache.clear();
        this.highest_cache_consistency_id = 0;
    }
    add(qsrs) {
        const persistable_qsrs = class_transformer_1.plainToClass(PersistableQueuedSubscription, qsrs, {
            excludeExtraneousValues: true
        });
        for (const qsr of persistable_qsrs) {
            this.cache.set(qsr.id, qsr);
        }
    }
}
__decorate([
    class_transformer_1.Expose(),
    __metadata("design:type", Object)
], QueuedSubscriptionCache.prototype, "highest_cache_consistency_id", void 0);
__decorate([
    class_transformer_1.Type(() => PersistableQueuedSubscription),
    class_transformer_1.Expose(),
    __metadata("design:type", Map)
], QueuedSubscriptionCache.prototype, "cache", void 0);
exports.QueuedSubscriptionCache = QueuedSubscriptionCache;
exports.QsrCacheOidScope = 'QsrCache';
// we just do this here, as it is
oid_1.Oid.RegisterScope(exports.QsrCacheOidScope, exports.QsrCacheOidScope);
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 *
 *
 */
let QsrLocalCacheModel = class QsrLocalCacheModel extends sequelize_typescript_1.Model {
    get cache() {
        return class_transformer_1.deserialize(QueuedSubscriptionCache, this.getDataValue('cache'));
    }
    set cache(active_subscriptions) {
        const subs_json = class_transformer_1.serialize(active_subscriptions);
        this.setDataValue('cache', subs_json);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], QsrLocalCacheModel.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], QsrLocalCacheModel.prototype, "service_name", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT({ length: 'long' })),
    __metadata("design:type", QueuedSubscriptionCache),
    __metadata("design:paramtypes", [QueuedSubscriptionCache])
], QsrLocalCacheModel.prototype, "cache", null);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], QsrLocalCacheModel.prototype, "created_at", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], QsrLocalCacheModel.prototype, "updated_at", void 0);
QsrLocalCacheModel = __decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        paranoid: false,
        underscored: true,
        tableName: 'qsr_local_cache'
    })
], QsrLocalCacheModel);
async function loadCache(opts) {
    const sequelize = init_sequelize_1.getSequelizeInstance();
    if (sequelize) {
        try {
            sequelize.model('QsrLocalCacheModel');
        }
        catch (error) {
            sequelize.addModels([QsrLocalCacheModel]);
        }
        // do we have a table in place?
        try {
            await QsrLocalCacheModel.sync();
        }
        catch (error) {
            // try creating the table
            await QsrLocalCacheModel.sync({ force: true });
        }
        let qsrCache = await QsrLocalCacheModel.findOne({
            transaction: opts === null || opts === void 0 ? void 0 : opts.transaction,
            lock: (opts === null || opts === void 0 ? void 0 : opts.transaction) ? true : undefined
        });
        if (!qsrCache) {
            qsrCache = await QsrLocalCacheModel.create({ cache: new QueuedSubscriptionCache() }, { transaction: opts === null || opts === void 0 ? void 0 : opts.transaction });
        }
        return qsrCache.cache;
    }
    throw new Error('sequelize not initialized');
}
exports.loadCache = loadCache;
async function saveCache(cache, opts) {
    const qsrCache = await QsrLocalCacheModel.findOne({ transaction: opts.transaction, lock: true });
    if (qsrCache) {
        qsrCache.cache = cache;
        await qsrCache.save({ transaction: opts === null || opts === void 0 ? void 0 : opts.transaction });
        return;
    }
    throw new Error('Invalid sequelize or cache must be loaded before saving');
}
exports.saveCache = saveCache;
//# sourceMappingURL=queued-subscription-cache.js.map