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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSubscriptionResolver = void 0;
const o11y_1 = require("@rumbleship/o11y");
const type_graphql_1 = require("type-graphql");
const rumbleship_subscription_1 = require("./rumbleship-subscription");
const create_node_notification_1 = require("./create-node-notification");
const topic_name_1 = require("../../app/server/topic-name");
function withSubscriptionResolver(capitalizedName, Base, notificationClsType, subscriptionFilterClsType, defaultScope) {
    const model_scoped_topic_name = topic_name_1.triggerName(undefined, capitalizedName);
    let SubscriptionResolver = class SubscriptionResolver extends Base {
        async onChange(rawPayload, args) {
            if (rawPayload) {
                return create_node_notification_1.createNodeNotification(rawPayload, this, notificationClsType, args === null || args === void 0 ? void 0 : args.watch_list);
            }
            return null;
        }
    };
    __decorate([
        type_graphql_1.Authorized(defaultScope),
        rumbleship_subscription_1.RumbleshipSubscription(type => notificationClsType, {
            name: `on${capitalizedName}Change`,
            // topics: `${NODE_CHANGE_NOTIFICATION}_${capitalizedName}`,
            topics: model_scoped_topic_name,
            nullable: true
        }),
        o11y_1.AddToTrace(),
        __param(0, type_graphql_1.Root()),
        __param(1, type_graphql_1.Args(type => subscriptionFilterClsType)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], SubscriptionResolver.prototype, "onChange", null);
    SubscriptionResolver = __decorate([
        type_graphql_1.Resolver({ isAbstract: true })
    ], SubscriptionResolver);
    return SubscriptionResolver;
}
exports.withSubscriptionResolver = withSubscriptionResolver;
//# sourceMappingURL=base-subscription-resolver.mixin.js.map