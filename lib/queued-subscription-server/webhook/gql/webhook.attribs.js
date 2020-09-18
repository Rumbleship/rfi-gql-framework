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
exports.buildWebhookBaseAttribs = void 0;
const acl_1 = require("@rumbleship/acl");
const type_graphql_1 = require("type-graphql");
const base_attribs_builder_1 = require("../../../gql/relay/base-attribs.builder");
const watchable_1 = require("../../../gql/relay/watchable");
const class_validator_1 = require("class-validator");
function buildWebhookBaseAttribs(attribType) {
    let BaseWebhookAttribs = class BaseWebhookAttribs {
    };
    __decorate([
        watchable_1.Watchable,
        acl_1.AuthorizerTreatAs([acl_1.Resource.Division]),
        type_graphql_1.Field(type => type_graphql_1.ID, { description: 'Rumbleship provided system_id/divsion_id', nullable: true }),
        __metadata("design:type", String)
    ], BaseWebhookAttribs.prototype, "system_id", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseWebhookAttribs.prototype, "subscription_url", void 0);
    __decorate([
        watchable_1.Watchable,
        class_validator_1.MaxLength(255),
        class_validator_1.MinLength(3),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseWebhookAttribs.prototype, "subscription_name", void 0);
    __decorate([
        class_validator_1.MaxLength(255),
        class_validator_1.MinLength(3),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseWebhookAttribs.prototype, "topic_name", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field(type => Boolean, { nullable: !base_attribs_builder_1.isInputOrObject(attribType) }),
        __metadata("design:type", Boolean)
    ], BaseWebhookAttribs.prototype, "active", void 0);
    BaseWebhookAttribs = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(attribType)
    ], BaseWebhookAttribs);
    return BaseWebhookAttribs;
}
exports.buildWebhookBaseAttribs = buildWebhookBaseAttribs;
//# sourceMappingURL=webhook.attribs.js.map