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
exports.withSubscriptionFilter = void 0;
const type_graphql_1 = require("type-graphql");
const watchlist_1 = require("./watchlist");
/**
 *
 * @param Base
 */
function withSubscriptionFilter(Base, watchListEnumNameOrEnum) {
    let watchlistEnum;
    if (typeof watchListEnumNameOrEnum === 'string') {
        watchlistEnum = watchlist_1.buildSubscriptionWatchList(Base);
        type_graphql_1.registerEnumType(watchlistEnum, {
            name: watchListEnumNameOrEnum,
            description: `The list of properties that can be watched for change`
        });
    }
    else {
        watchlistEnum = watchListEnumNameOrEnum;
    }
    let SubscriptionFilter = class SubscriptionFilter extends Base {
    };
    __decorate([
        type_graphql_1.Field(type => [watchlistEnum], {
            nullable: true,
            description: 'List of attributes to watch. Subscription only triggers when one or more of these attributes change'
        }),
        __metadata("design:type", Array)
    ], SubscriptionFilter.prototype, "watch_list", void 0);
    __decorate([
        type_graphql_1.Field(type => type_graphql_1.ID, { nullable: true }),
        __metadata("design:type", String)
    ], SubscriptionFilter.prototype, "id", void 0);
    SubscriptionFilter = __decorate([
        type_graphql_1.ArgsType()
    ], SubscriptionFilter);
    return SubscriptionFilter;
}
exports.withSubscriptionFilter = withSubscriptionFilter;
//# sourceMappingURL=with_subscription_filter.mixin.js.map