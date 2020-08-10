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
exports.QueuedSubscriptionRequestModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const __1 = require("../../../");
const queued_subscription_request_relay_1 = require("../gql/queued_subscription_request.relay");
const QueuedSubscriptionRequestValidator = class extends queued_subscription_request_relay_1.buildQueuedSubscriptionRequestBaseAttribs(__1.AttribType.ValidateOnly) {
};
let QueuedSubscriptionRequestModel = class QueuedSubscriptionRequestModel extends sequelize_typescript_1.Model {
    static afterValidateHook(instance, options) {
        __1.validateFromExemplar(instance, QueuedSubscriptionRequestValidator);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], QueuedSubscriptionRequestModel.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "authorized_requestor_id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "marshalled_acl", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT) // 64k limit...
    ,
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "gql_query_string", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "query_attributes", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "operation_name", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "publish_to_topic_name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], QueuedSubscriptionRequestModel.prototype, "client_request_uuid", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], QueuedSubscriptionRequestModel.prototype, "active", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], QueuedSubscriptionRequestModel.prototype, "created_at", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], QueuedSubscriptionRequestModel.prototype, "updated_at", void 0);
__decorate([
    sequelize_typescript_1.DeletedAt,
    __metadata("design:type", Date)
], QueuedSubscriptionRequestModel.prototype, "deleted_at", void 0);
__decorate([
    sequelize_typescript_1.AfterValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueuedSubscriptionRequestModel, Object]),
    __metadata("design:returntype", void 0)
], QueuedSubscriptionRequestModel, "afterValidateHook", null);
QueuedSubscriptionRequestModel = __decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'queued_subscription_requests'
    })
], QueuedSubscriptionRequestModel);
exports.QueuedSubscriptionRequestModel = QueuedSubscriptionRequestModel;
//# sourceMappingURL=queued_subscription_request.model.js.map