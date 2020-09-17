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
exports.QueuedSubscriptionRequestFilterForSubscriptions = exports.QueuedSubscriptionRequestFilter = exports.QueuedSubscriptionRequestUpdate = exports.QueuedSubscriptionRequestInput = exports.QueuedSubscriptionRequestConnection = exports.QueuedSubscriptionRequestEdge = exports.QueuedSubscriptionRequestNotification = exports.QueuedSubscriptionRequest = exports.WebhookSubscription = exports.buildQueuedSubscriptionRequestBaseAttribs = void 0;
const type_graphql_1 = require("type-graphql");
const relay_interface_1 = require("../../../gql/relay/relay.interface");
const attrib_enum_1 = require("../../../gql/relay/attrib.enum");
const base_attribs_builder_1 = require("../../../gql/relay/base-attribs.builder");
const node_notification_builder_1 = require("../../../gql/relay/node-notification.builder");
const with_timestamps_mixin_1 = require("../../../gql/relay/mixins/with-timestamps.mixin");
const relay_edge_connection_builder_1 = require("../../../gql/relay/relay-edge-connection.builder");
const with_order_by_filter_mixin_1 = require("../../../gql/relay/mixins/with-order-by-filter.mixin");
const with_pagination_filter_mixin_1 = require("../../../gql/relay/mixins/with-pagination-filter.mixin");
const with_timestamps_filter_mixin_1 = require("../../../gql/relay/mixins/with-timestamps-filter.mixin");
const class_validator_1 = require("class-validator");
const acl_1 = require("@rumbleship/acl");
const inititialize_queued_subscription_relay_1 = require("../../inititialize-queued-subscription-relay");
const with_subscription_filter_mixin_1 = require("../../../gql/relay/mixins/with-subscription-filter.mixin");
const watchable_1 = require("../../../gql/relay/watchable");
const MAX_QUERY_STRING_LENGTH = 65535;
const MAX_OPERATION_NAME_LENGTH = 2000;
// GOOGLE PUBSUB LIMITS ON TOPIC NAMES: https://cloud.google.com/pubsub/docs/admin#resource_names
const MAX_TOPIC_NAME_LEN = 255;
const MIN_TOPIC_NAME_LEN = 3;
const TOPIC_REGEX = /[A-Za-z0-9-_.~+%]/;
function buildQueuedSubscriptionRequestBaseAttribs(attribType) {
    let BaseQueuedSubscriptionRequestAttribs = class BaseQueuedSubscriptionRequestAttribs {
    };
    __decorate([
        watchable_1.Watchable,
        acl_1.AuthorizerTreatAs([acl_1.Resource.User]),
        type_graphql_1.Field(type => type_graphql_1.ID, { nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "authorized_requestor_id", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "marshalled_acl", void 0);
    __decorate([
        watchable_1.Watchable,
        class_validator_1.MaxLength(MAX_QUERY_STRING_LENGTH),
        type_graphql_1.Field({ nullable: !base_attribs_builder_1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "gql_query_string", void 0);
    __decorate([
        watchable_1.Watchable,
        class_validator_1.MaxLength(MAX_QUERY_STRING_LENGTH),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "query_attributes", void 0);
    __decorate([
        watchable_1.Watchable,
        class_validator_1.MaxLength(MAX_OPERATION_NAME_LENGTH),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "operation_name", void 0);
    __decorate([
        watchable_1.Watchable,
        class_validator_1.MaxLength(MAX_TOPIC_NAME_LEN),
        class_validator_1.MinLength(MIN_TOPIC_NAME_LEN),
        class_validator_1.Matches(TOPIC_REGEX),
        type_graphql_1.Field({ nullable: !base_attribs_builder_1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "publish_to_topic_name", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field({ nullable: !base_attribs_builder_1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "client_request_uuid", void 0);
    __decorate([
        watchable_1.Watchable,
        type_graphql_1.Field(type => Boolean, { nullable: !base_attribs_builder_1.isInputOrObject(attribType) }),
        __metadata("design:type", Boolean)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "active", void 0);
    BaseQueuedSubscriptionRequestAttribs = __decorate([
        base_attribs_builder_1.GqlBaseAttribs(attribType)
    ], BaseQueuedSubscriptionRequestAttribs);
    return BaseQueuedSubscriptionRequestAttribs;
}
exports.buildQueuedSubscriptionRequestBaseAttribs = buildQueuedSubscriptionRequestBaseAttribs;
let WebhookSubscription = class WebhookSubscription {
};
__decorate([
    type_graphql_1.Field({ nullable: false }),
    __metadata("design:type", String)
], WebhookSubscription.prototype, "gql_query_string", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], WebhookSubscription.prototype, "query_attributes", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], WebhookSubscription.prototype, "operation_name", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", String)
], WebhookSubscription.prototype, "client_request_uuid", void 0);
__decorate([
    type_graphql_1.Field(type => Boolean, { nullable: false }),
    __metadata("design:type", Boolean)
], WebhookSubscription.prototype, "active", void 0);
WebhookSubscription = __decorate([
    type_graphql_1.InterfaceType({ implements: relay_interface_1.Node }) /*abstract*/
], WebhookSubscription);
exports.WebhookSubscription = WebhookSubscription;
let QueuedSubscriptionRequestConcrete = class QueuedSubscriptionRequestConcrete extends buildQueuedSubscriptionRequestBaseAttribs(attrib_enum_1.AttribType.Obj) {
};
QueuedSubscriptionRequestConcrete = __decorate([
    type_graphql_1.ObjectType({ implements: [relay_interface_1.Node, WebhookSubscription], isAbstract: true })
], QueuedSubscriptionRequestConcrete);
let QueuedSubscriptionRequest = class QueuedSubscriptionRequest extends with_timestamps_mixin_1.withTimeStamps(attrib_enum_1.AttribType.Obj, QueuedSubscriptionRequestConcrete) {
};
QueuedSubscriptionRequest = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequest`, {
        implements: [relay_interface_1.Node, WebhookSubscription]
    })
], QueuedSubscriptionRequest);
exports.QueuedSubscriptionRequest = QueuedSubscriptionRequest;
let QueuedSubscriptionRequestNotification = class QueuedSubscriptionRequestNotification extends node_notification_builder_1.GqlNodeNotification(QueuedSubscriptionRequest) {
};
QueuedSubscriptionRequestNotification = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestNotification`)
], QueuedSubscriptionRequestNotification);
exports.QueuedSubscriptionRequestNotification = QueuedSubscriptionRequestNotification;
let QueuedSubscriptionRequestEdge = class QueuedSubscriptionRequestEdge extends relay_edge_connection_builder_1.buildEdgeClass({
    RelayClass: QueuedSubscriptionRequest,
    SchemaClass: WebhookSubscription
}) {
};
QueuedSubscriptionRequestEdge = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestEdge`)
], QueuedSubscriptionRequestEdge);
exports.QueuedSubscriptionRequestEdge = QueuedSubscriptionRequestEdge;
let QueuedSubscriptionRequestConnection = class QueuedSubscriptionRequestConnection extends relay_edge_connection_builder_1.buildConnectionClass({
    RelayClass: QueuedSubscriptionRequest,
    EdgeClass: QueuedSubscriptionRequestEdge
}) {
};
QueuedSubscriptionRequestConnection = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestConnection`)
], QueuedSubscriptionRequestConnection);
exports.QueuedSubscriptionRequestConnection = QueuedSubscriptionRequestConnection;
let QueuedSubscriptionRequestInput = class QueuedSubscriptionRequestInput extends buildQueuedSubscriptionRequestBaseAttribs(attrib_enum_1.AttribType.Input) {
};
QueuedSubscriptionRequestInput = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestInput`)
], QueuedSubscriptionRequestInput);
exports.QueuedSubscriptionRequestInput = QueuedSubscriptionRequestInput;
let QueuedSubscriptionRequestUpdate = class QueuedSubscriptionRequestUpdate extends buildQueuedSubscriptionRequestBaseAttribs(attrib_enum_1.AttribType.Update) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID),
    __metadata("design:type", String)
], QueuedSubscriptionRequestUpdate.prototype, "id", void 0);
QueuedSubscriptionRequestUpdate = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestUpdate`)
], QueuedSubscriptionRequestUpdate);
exports.QueuedSubscriptionRequestUpdate = QueuedSubscriptionRequestUpdate;
let ConcreteQueuedSubscriptionRequestFilter = class ConcreteQueuedSubscriptionRequestFilter extends buildQueuedSubscriptionRequestBaseAttribs(attrib_enum_1.AttribType.Arg) {
};
ConcreteQueuedSubscriptionRequestFilter = __decorate([
    type_graphql_1.ArgsType()
], ConcreteQueuedSubscriptionRequestFilter);
let QueuedSubscriptionRequestFilter = class QueuedSubscriptionRequestFilter extends with_order_by_filter_mixin_1.withOrderByFilter(with_pagination_filter_mixin_1.withPaginationFilter(with_timestamps_filter_mixin_1.withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter))) {
};
QueuedSubscriptionRequestFilter = __decorate([
    type_graphql_1.ArgsType()
], QueuedSubscriptionRequestFilter);
exports.QueuedSubscriptionRequestFilter = QueuedSubscriptionRequestFilter;
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
let QueuedSubscriptionRequestFilterForSubscriptions = class QueuedSubscriptionRequestFilterForSubscriptions extends with_subscription_filter_mixin_1.withSubscriptionFilter(with_timestamps_filter_mixin_1.withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter), `QueuedSubscriptionRequestWatchList` // note this is called before the server is bootstraped, so no access to config. But that is OK as the enum should be unique within a service
) {
};
QueuedSubscriptionRequestFilterForSubscriptions = __decorate([
    type_graphql_1.ArgsType()
], QueuedSubscriptionRequestFilterForSubscriptions);
exports.QueuedSubscriptionRequestFilterForSubscriptions = QueuedSubscriptionRequestFilterForSubscriptions;
//# sourceMappingURL=queued-subscription-request.relay.js.map