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
exports.GqlNodeNotification = exports.GqlModelDelta = void 0;
const type_graphql_1 = require("type-graphql");
const notification_of_enum_1 = require("./notification-of.enum");
const node_notification_1 = require("./node-notification");
let GqlModelDelta = class GqlModelDelta extends node_notification_1.ModelDeltaClass {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], GqlModelDelta.prototype, "key", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], GqlModelDelta.prototype, "previousValue", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], GqlModelDelta.prototype, "newValue", void 0);
GqlModelDelta = __decorate([
    type_graphql_1.ObjectType('Delta')
], GqlModelDelta);
exports.GqlModelDelta = GqlModelDelta;
function GqlNodeNotification(clsNotification) {
    let GqlNodeNotificationClass = class GqlNodeNotificationClass extends node_notification_1.NodeNotification {
        constructor(notificationOf, idempotency_key, node, watch_list_deltas) {
            super(notificationOf, idempotency_key, node, watch_list_deltas);
            this.watch_list_deltas = [];
        }
    };
    __decorate([
        type_graphql_1.Field(),
        __metadata("design:type", String)
    ], GqlNodeNotificationClass.prototype, "idempotency_key", void 0);
    __decorate([
        type_graphql_1.Field(type => notification_of_enum_1.NotificationOf),
        __metadata("design:type", String)
    ], GqlNodeNotificationClass.prototype, "notificationOf", void 0);
    __decorate([
        type_graphql_1.Field(type => clsNotification, { nullable: true }),
        __metadata("design:type", Object)
    ], GqlNodeNotificationClass.prototype, "node", void 0);
    __decorate([
        type_graphql_1.Field(type => [GqlModelDelta]),
        __metadata("design:type", Array)
    ], GqlNodeNotificationClass.prototype, "watch_list_deltas", void 0);
    GqlNodeNotificationClass = __decorate([
        type_graphql_1.ObjectType({ isAbstract: true }),
        __metadata("design:paramtypes", [String, String, Object, Array])
    ], GqlNodeNotificationClass);
    return GqlNodeNotificationClass;
}
exports.GqlNodeNotification = GqlNodeNotification;
//# sourceMappingURL=node-notification.builder.js.map