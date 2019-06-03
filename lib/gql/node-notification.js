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
const type_graphql_1 = require("type-graphql");
const node_interface_1 = require("./node.interface");
var NotificationOf;
(function (NotificationOf) {
    NotificationOf["LAST_KNOWN_STATE"] = "LAST_KNOWN_STATE";
    NotificationOf["CREATED"] = "CREATED";
    NotificationOf["UPDATED"] = "UPDATED";
    NotificationOf["DESTROYED"] = "DESTORYED";
    NotificationOf["BULK_CHANGE"] = "BULK_CHANGE";
})(NotificationOf = exports.NotificationOf || (exports.NotificationOf = {}));
type_graphql_1.registerEnumType(NotificationOf, {
    name: 'NotificationOf',
    description: `For PubSub: The type of Notification. Note that BULK_CHANGE is sent when multiple 
  updates creates or destroys have been detected and the server can't be sure what they were EG if a
  complex bulk create or update was executed by the server,and the client should generally refresh all models 
  they are interested in.
  `
});
let GqlNodeNotification = class GqlNodeNotification {
    constructor(notificationOf, node) {
        this.sequence = Date.now();
        this.notificationOf = notificationOf;
        this.node = node;
    }
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Number)
], GqlNodeNotification.prototype, "sequence", void 0);
__decorate([
    type_graphql_1.Field(type => NotificationOf),
    __metadata("design:type", String)
], GqlNodeNotification.prototype, "notificationOf", void 0);
__decorate([
    type_graphql_1.Field(type => [node_interface_1.Node], { nullable: true }),
    __metadata("design:type", Object)
], GqlNodeNotification.prototype, "node", void 0);
GqlNodeNotification = __decorate([
    type_graphql_1.ObjectType(),
    __metadata("design:paramtypes", [String, Object])
], GqlNodeNotification);
exports.GqlNodeNotification = GqlNodeNotification;
// and the type used to transmit database changes
class DbModelChangeNotification {
    constructor(notificationOf, model) {
        this.notificationOf = notificationOf;
        this.model = model;
    }
}
exports.DbModelChangeNotification = DbModelChangeNotification;
//# sourceMappingURL=node-notification.js.map