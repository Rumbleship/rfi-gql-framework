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
exports.withTimeStampsFilter = void 0;
const type_graphql_1 = require("type-graphql");
const daterange_scalar_1 = require("../../scalars/daterange.scalar");
const watchable_1 = require("../watchable");
function withTimeStampsFilter(Base) {
    let TimeStampsFilter = class TimeStampsFilter extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "created_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_scalar_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_scalar_1.DateRange)
    ], TimeStampsFilter.prototype, "created_between", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "updated_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_scalar_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_scalar_1.DateRange)
    ], TimeStampsFilter.prototype, "updated_between", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field(type => Date, { nullable: true }),
        __metadata("design:type", Date)
    ], TimeStampsFilter.prototype, "deleted_at", void 0);
    __decorate([
        type_graphql_1.Field(type => daterange_scalar_1.DateRangeGQL, { nullable: true }),
        __metadata("design:type", daterange_scalar_1.DateRange)
    ], TimeStampsFilter.prototype, "deleted_between", void 0);
    TimeStampsFilter = __decorate([
        type_graphql_1.ArgsType()
    ], TimeStampsFilter);
    return TimeStampsFilter;
}
exports.withTimeStampsFilter = withTimeStampsFilter;
//# sourceMappingURL=with-timestamps-filter.mixin.js.map