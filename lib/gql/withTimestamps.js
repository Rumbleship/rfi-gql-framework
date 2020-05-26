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
const daterange_type_1 = require("./daterange.type");
const gql_helpers_1 = require("./gql_helpers");
const type_graphql_1 = require("type-graphql");
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
        gql_helpers_1.GqlBaseAttribs(attribType)
    ], TimeStampedGQL);
    return TimeStampedGQL;
}
exports.withTimeStamps = withTimeStamps;
function withTimeStampsFilter(Base) {
    let TimeStampsFilter = class TimeStampsFilter extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "created_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_type_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_type_1.DateRange)
    ], TimeStampsFilter.prototype, "created_between", void 0);
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "updated_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_type_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_type_1.DateRange)
    ], TimeStampsFilter.prototype, "updated_between", void 0);
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "deleted_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_type_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_type_1.DateRange)
    ], TimeStampsFilter.prototype, "deleted_between", void 0);
    TimeStampsFilter = __decorate([
        type_graphql_1.ArgsType()
    ], TimeStampsFilter);
    return TimeStampsFilter;
}
exports.withTimeStampsFilter = withTimeStampsFilter;
//# sourceMappingURL=withTimestamps.js.map