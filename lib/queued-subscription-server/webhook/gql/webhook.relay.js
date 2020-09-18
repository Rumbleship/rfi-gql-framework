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
exports.WebhookFilterForSubscriptions = exports.WebhookFilter = exports.WebhookUpdate = exports.WebhookInput = exports.WebhookConnection = exports.WebhookEdge = exports.WebhookNotification = exports.Webhook = void 0;
const type_graphql_1 = require("type-graphql");
const relay_interface_1 = require("../../../gql/relay/relay.interface");
const attrib_enum_1 = require("../../../gql/relay/attrib.enum");
const node_notification_builder_1 = require("../../../gql/relay/node-notification.builder");
const with_timestamps_mixin_1 = require("../../../gql/relay/mixins/with-timestamps.mixin");
const relay_edge_connection_builder_1 = require("../../../gql/relay/relay-edge-connection.builder");
const with_order_by_filter_mixin_1 = require("../../../gql/relay/mixins/with-order-by-filter.mixin");
const with_pagination_filter_mixin_1 = require("../../../gql/relay/mixins/with-pagination-filter.mixin");
const with_timestamps_filter_mixin_1 = require("../../../gql/relay/mixins/with-timestamps-filter.mixin");
const inititialize_queued_subscription_relay_1 = require("../../inititialize-queued-subscription-relay");
const with_subscription_filter_mixin_1 = require("../../../gql/relay/mixins/with-subscription-filter.mixin");
const relay_mutation_1 = require("../../../gql/relay/relay_mutation");
const webhook_attribs_1 = require("./webhook.attribs");
let WebhookConcrete = class WebhookConcrete extends webhook_attribs_1.buildWebhookBaseAttribs(attrib_enum_1.AttribType.Obj) {
};
WebhookConcrete = __decorate([
    type_graphql_1.ObjectType({ implements: relay_interface_1.Node, isAbstract: true })
], WebhookConcrete);
let Webhook = class Webhook extends with_timestamps_mixin_1.withTimeStamps(attrib_enum_1.AttribType.Obj, WebhookConcrete) {
};
Webhook = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}Webhook`, { implements: relay_interface_1.Node })
], Webhook);
exports.Webhook = Webhook;
let WebhookNotification = class WebhookNotification extends node_notification_builder_1.GqlNodeNotification(Webhook) {
};
WebhookNotification = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}WebhookNotification`)
], WebhookNotification);
exports.WebhookNotification = WebhookNotification;
let WebhookEdge = class WebhookEdge extends relay_edge_connection_builder_1.buildEdgeClass({
    RelayClass: Webhook
}) {
};
WebhookEdge = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}WebhookEdge`)
], WebhookEdge);
exports.WebhookEdge = WebhookEdge;
let WebhookConnection = class WebhookConnection extends relay_edge_connection_builder_1.buildConnectionClass({
    RelayClass: Webhook,
    EdgeClass: WebhookEdge
}) {
};
WebhookConnection = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}WebhookConnection`)
], WebhookConnection);
exports.WebhookConnection = WebhookConnection;
let WebhookInput = class WebhookInput extends relay_mutation_1.withRelayMutationInput(webhook_attribs_1.buildWebhookBaseAttribs(attrib_enum_1.AttribType.Input)) {
};
WebhookInput = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}WebhookInput`)
], WebhookInput);
exports.WebhookInput = WebhookInput;
let WebhookUpdate = class WebhookUpdate extends webhook_attribs_1.buildWebhookBaseAttribs(attrib_enum_1.AttribType.Update) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID),
    __metadata("design:type", String)
], WebhookUpdate.prototype, "id", void 0);
WebhookUpdate = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}WebhookUpdate`)
], WebhookUpdate);
exports.WebhookUpdate = WebhookUpdate;
let ConcreteWebhookFilter = class ConcreteWebhookFilter extends webhook_attribs_1.buildWebhookBaseAttribs(attrib_enum_1.AttribType.Arg) {
};
ConcreteWebhookFilter = __decorate([
    type_graphql_1.ArgsType()
], ConcreteWebhookFilter);
let WebhookFilter = class WebhookFilter extends with_order_by_filter_mixin_1.withOrderByFilter(with_pagination_filter_mixin_1.withPaginationFilter(with_timestamps_filter_mixin_1.withTimeStampsFilter(ConcreteWebhookFilter))) {
};
WebhookFilter = __decorate([
    type_graphql_1.ArgsType()
], WebhookFilter);
exports.WebhookFilter = WebhookFilter;
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
let WebhookFilterForSubscriptions = class WebhookFilterForSubscriptions extends with_subscription_filter_mixin_1.withSubscriptionFilter(with_timestamps_filter_mixin_1.withTimeStampsFilter(ConcreteWebhookFilter), `WebhookWatchList` // note this is called before the server is bootstraped, so no access to config. But that is OK as the enum should be unique within a service
) {
};
WebhookFilterForSubscriptions = __decorate([
    type_graphql_1.ArgsType()
], WebhookFilterForSubscriptions);
exports.WebhookFilterForSubscriptions = WebhookFilterForSubscriptions;
//# sourceMappingURL=webhook.relay.js.map