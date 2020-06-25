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
exports.withOrderByFilter = void 0;
const type_graphql_1 = require("type-graphql");
const relay_order_by_scalar_1 = require("../scalars/relay-order-by.scalar");
function withOrderByFilter(Base) {
    let OrderByFilter = class OrderByFilter extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => relay_order_by_scalar_1.RelayOrderByGQL, { nullable: true }),
        __metadata("design:type", relay_order_by_scalar_1.RelayOrderBy)
    ], OrderByFilter.prototype, "order_by", void 0);
    OrderByFilter = __decorate([
        type_graphql_1.ArgsType()
    ], OrderByFilter);
    return OrderByFilter;
}
exports.withOrderByFilter = withOrderByFilter;
//# sourceMappingURL=with_order_by_filter.mixin.js.map