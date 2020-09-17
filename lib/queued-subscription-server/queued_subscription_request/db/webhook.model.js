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
exports.WebhookModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const validate_from_exemplar_1 = require("../../../db/helpers/validate-from-exemplar");
const attrib_enum_1 = require("../../../gql/relay/attrib.enum");
const webhook_attribs_1 = require("../gql/webhook.attribs");
// eslint-disable-next-line import/no-cycle
const queued_subscription_request_model_1 = require("./queued-subscription-request.model");
const WebhookValidator = class extends webhook_attribs_1.buildWebhookBaseAttribs(attrib_enum_1.AttribType.ValidateOnly) {
};
let WebhookModel = class WebhookModel extends sequelize_typescript_1.Model {
    static afterValidateHook(instance, options) {
        validate_from_exemplar_1.validateFromExemplar(instance, WebhookValidator);
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], WebhookModel.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], WebhookModel.prototype, "division_id", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], WebhookModel.prototype, "subscription_url", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], WebhookModel.prototype, "subscription_name", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], WebhookModel.prototype, "topic_name", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false
    }),
    __metadata("design:type", String)
], WebhookModel.prototype, "active", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => queued_subscription_request_model_1.QueuedSubscriptionRequestModel),
    __metadata("design:type", Array)
], WebhookModel.prototype, "webhookSubscriptions", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], WebhookModel.prototype, "created_at", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], WebhookModel.prototype, "updated_at", void 0);
__decorate([
    sequelize_typescript_1.DeletedAt,
    __metadata("design:type", Date)
], WebhookModel.prototype, "deleted_at", void 0);
__decorate([
    sequelize_typescript_1.AfterValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebhookModel, Object]),
    __metadata("design:returntype", void 0)
], WebhookModel, "afterValidateHook", null);
WebhookModel = __decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'webhooks'
    })
], WebhookModel);
exports.WebhookModel = WebhookModel;
//# sourceMappingURL=webhook.model.js.map