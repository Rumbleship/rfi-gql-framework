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
exports.saveCache = exports.loadCache = void 0;
const class_transformer_1 = require("class-transformer");
/**
 * Keeps the cache consistent
 * The cachce creates the table if it doesnt exist. (no migrations, as it is destroyed everytime it rewrites)
 *
 *
 */
const sequelize_typescript_1 = require("sequelize-typescript");
const app_1 = require("../app");
const queued_subscription_cache_1 = require("./queued-subscription-cache");
let QsrLocalCacheModel = class QsrLocalCacheModel extends sequelize_typescript_1.Model {
    get cache() {
        return class_transformer_1.deserialize(queued_subscription_cache_1.QueuedSubscriptionCache, this.getDataValue('cache'));
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
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", queued_subscription_cache_1.QueuedSubscriptionCache),
    __metadata("design:paramtypes", [queued_subscription_cache_1.QueuedSubscriptionCache])
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
async function loadCache() {
    const sequelize = app_1.getSequelizeInstance();
    if (sequelize) {
        if (!sequelize.model(QsrLocalCacheModel)) {
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
        const qsrCache = await QsrLocalCacheModel.findOne({});
        if (qsrCache) {
            return qsrCache.cache;
        }
        else {
            return new queued_subscription_cache_1.QueuedSubscriptionCache();
        }
    }
    throw new Error('sequelize not initialized');
}
exports.loadCache = loadCache;
async function saveCache(cache) {
    const sequelize = app_1.getSequelizeInstance();
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
exports.saveCache = saveCache;
//# sourceMappingURL=cache-control.js.map