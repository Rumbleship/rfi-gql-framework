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
exports.withTimeStamps = void 0;
const type_graphql_1 = require("type-graphql");
const base_attribs_builder_1 = require("../base-attribs.builder");
function withTimeStamps(attribType, Base) {
    let TimeStampedGQL = class TimeStampedGQL extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampedGQL.prototype, "created_at", void 0);
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampedGQL.prototype, "updated_at", void 0);
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampedGQL.prototype, "deleted_at", void 0);
    TimeStampedGQL = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(attribType)
    ], TimeStampedGQL);
    return TimeStampedGQL;
}
exports.withTimeStamps = withTimeStamps;
//# sourceMappingURL=with-timestamps.mixin.js.map