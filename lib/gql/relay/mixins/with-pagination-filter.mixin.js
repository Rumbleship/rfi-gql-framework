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
exports.withPaginationFilter = void 0;
const type_graphql_1 = require("type-graphql");
const class_validator_1 = require("class-validator");
function withPaginationFilter(Base) {
    let ConnectionFilter = class ConnectionFilter extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => type_graphql_1.Int, { nullable: true }),
        class_validator_1.Min(0),
        __metadata("design:type", Number)
    ], ConnectionFilter.prototype, "first", void 0);
    __decorate([
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], ConnectionFilter.prototype, "after", void 0);
    __decorate([
        type_graphql_1.Field(type => type_graphql_1.Int, { nullable: true }),
        class_validator_1.Min(0),
        __metadata("design:type", Number)
    ], ConnectionFilter.prototype, "last", void 0);
    __decorate([
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], ConnectionFilter.prototype, "before", void 0);
    __decorate([
        type_graphql_1.Field(type => type_graphql_1.ID, { nullable: true }),
        __metadata("design:type", String)
    ], ConnectionFilter.prototype, "id", void 0);
    ConnectionFilter = __decorate([
        type_graphql_1.ArgsType()
    ], ConnectionFilter);
    return ConnectionFilter;
}
exports.withPaginationFilter = withPaginationFilter;
//# sourceMappingURL=with-pagination-filter.mixin.js.map