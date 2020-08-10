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
exports.QueuedSubscriptionRequestFilterForSubscriptions = exports.QueuedSubscriptionRequestFilter = exports.QueuedSubscriptionRequestUpdate = exports.QueuedSubscriptionRequestInput = exports.QueuedSubscriptionRequestConnection = exports.QueuedSubscriptionRequestEdge = exports.QueuedSubscriptionRequestNotification = exports.QueuedSubscriptionRequest = exports.buildQueuedSubscriptionRequestBaseAttribs = void 0;
const type_graphql_1 = require("type-graphql");
const __1 = require("../../../");
const class_validator_1 = require("class-validator");
const acl_1 = require("@rumbleship/acl");
const inititialize_queued_subscription_relay_1 = require("../../inititialize_queued_subscription_relay");
const with_subscription_filter_mixin_1 = require("../../with_subscription_filter.mixin");
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
        acl_1.AuthorizerTreatAs([acl_1.Resource.User]),
        type_graphql_1.Field(type => type_graphql_1.ID, { nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "authorized_requestor_id", void 0);
    __decorate([
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "marshalled_acl", void 0);
    __decorate([
        class_validator_1.MaxLength(MAX_QUERY_STRING_LENGTH),
        type_graphql_1.Field({ nullable: !__1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "gql_query_string", void 0);
    __decorate([
        class_validator_1.MaxLength(MAX_QUERY_STRING_LENGTH),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "query_attributes", void 0);
    __decorate([
        class_validator_1.MaxLength(MAX_OPERATION_NAME_LENGTH),
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "operation_name", void 0);
    __decorate([
        class_validator_1.MaxLength(MAX_TOPIC_NAME_LEN),
        class_validator_1.MinLength(MIN_TOPIC_NAME_LEN),
        class_validator_1.Matches(TOPIC_REGEX),
        type_graphql_1.Field({ nullable: !__1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "publish_to_topic_name", void 0);
    __decorate([
        type_graphql_1.Field({ nullable: !__1.isInputOrObject(attribType) }),
        __metadata("design:type", String)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "client_request_uuid", void 0);
    __decorate([
        type_graphql_1.Field(type => Boolean, { nullable: !__1.isInputOrObject(attribType) }),
        __metadata("design:type", Boolean)
    ], BaseQueuedSubscriptionRequestAttribs.prototype, "active", void 0);
    BaseQueuedSubscriptionRequestAttribs = __decorate([
        __1.GqlBaseAttribs(attribType)
    ], BaseQueuedSubscriptionRequestAttribs);
    return BaseQueuedSubscriptionRequestAttribs;
}
exports.buildQueuedSubscriptionRequestBaseAttribs = buildQueuedSubscriptionRequestBaseAttribs;
let QueuedSubscriptionRequestConcrete = class QueuedSubscriptionRequestConcrete extends buildQueuedSubscriptionRequestBaseAttribs(__1.AttribType.Obj) {
};
QueuedSubscriptionRequestConcrete = __decorate([
    type_graphql_1.ObjectType({ implements: __1.Node, isAbstract: true })
], QueuedSubscriptionRequestConcrete);
let QueuedSubscriptionRequest = class QueuedSubscriptionRequest extends __1.withTimeStamps(__1.AttribType.Obj, QueuedSubscriptionRequestConcrete) {
};
QueuedSubscriptionRequest = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequest`, { implements: __1.Node })
], QueuedSubscriptionRequest);
exports.QueuedSubscriptionRequest = QueuedSubscriptionRequest;
let QueuedSubscriptionRequestNotification = class QueuedSubscriptionRequestNotification extends __1.GqlNodeNotification(QueuedSubscriptionRequest) {
};
QueuedSubscriptionRequestNotification = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestNotification`)
], QueuedSubscriptionRequestNotification);
exports.QueuedSubscriptionRequestNotification = QueuedSubscriptionRequestNotification;
let QueuedSubscriptionRequestEdge = class QueuedSubscriptionRequestEdge extends __1.buildEdgeClass({
    RelayClass: QueuedSubscriptionRequest
}) {
};
QueuedSubscriptionRequestEdge = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestEdge`)
], QueuedSubscriptionRequestEdge);
exports.QueuedSubscriptionRequestEdge = QueuedSubscriptionRequestEdge;
let QueuedSubscriptionRequestConnection = class QueuedSubscriptionRequestConnection extends __1.buildConnectionClass({
    RelayClass: QueuedSubscriptionRequest,
    EdgeClass: QueuedSubscriptionRequestEdge
}) {
};
QueuedSubscriptionRequestConnection = __decorate([
    type_graphql_1.ObjectType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestConnection`)
], QueuedSubscriptionRequestConnection);
exports.QueuedSubscriptionRequestConnection = QueuedSubscriptionRequestConnection;
let QueuedSubscriptionRequestInput = class QueuedSubscriptionRequestInput extends buildQueuedSubscriptionRequestBaseAttribs(__1.AttribType.Input) {
};
QueuedSubscriptionRequestInput = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestInput`)
], QueuedSubscriptionRequestInput);
exports.QueuedSubscriptionRequestInput = QueuedSubscriptionRequestInput;
let QueuedSubscriptionRequestUpdate = class QueuedSubscriptionRequestUpdate extends buildQueuedSubscriptionRequestBaseAttribs(__1.AttribType.Update) {
};
__decorate([
    type_graphql_1.Field(type => type_graphql_1.ID),
    __metadata("design:type", String)
], QueuedSubscriptionRequestUpdate.prototype, "id", void 0);
QueuedSubscriptionRequestUpdate = __decorate([
    type_graphql_1.InputType(`${inititialize_queued_subscription_relay_1.getRelayPrefix()}QueuedSubscriptionRequestUpdate`)
], QueuedSubscriptionRequestUpdate);
exports.QueuedSubscriptionRequestUpdate = QueuedSubscriptionRequestUpdate;
let ConcreteQueuedSubscriptionRequestFilter = class ConcreteQueuedSubscriptionRequestFilter extends buildQueuedSubscriptionRequestBaseAttribs(__1.AttribType.Arg) {
};
ConcreteQueuedSubscriptionRequestFilter = __decorate([
    type_graphql_1.ArgsType()
], ConcreteQueuedSubscriptionRequestFilter);
let QueuedSubscriptionRequestFilter = class QueuedSubscriptionRequestFilter extends __1.withOrderByFilter(__1.withPaginationFilter(__1.withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter))) {
};
QueuedSubscriptionRequestFilter = __decorate([
    type_graphql_1.ArgsType()
], QueuedSubscriptionRequestFilter);
exports.QueuedSubscriptionRequestFilter = QueuedSubscriptionRequestFilter;
/***
 * We could create this list off the actual Relay object, but that would project into the schema
 * internal properties suvh as _service. So although it is labourious, we explicitly create the
 * property watch list we want to watch.
 * TODO
 * There is probably some fabulous way of making this all a lot more typesafe,
 * but I really dont have time right now to work that out
 * hints may be here: https://stackoverflow.com/questions/54058699/is-there-a-way-to-dynamically-generate-enums-on-typescript-based-on-object-keys
 * I kind of think we are getting to the point where we may want to make some 'super decorators' that, similar to the buildAttributes builders
 * wrap both the Gql decorators and also the TypescriptSequelize so we can trully have a singular definition of the attributes,
 * with parameters in the super decorator that slects them in and out of the different types...
 * Bit late now.
 */
var QueuedSubscriptionRequestWatchList;
(function (QueuedSubscriptionRequestWatchList) {
    QueuedSubscriptionRequestWatchList["authorized_requestor_id"] = "authorized_requestor_id";
    QueuedSubscriptionRequestWatchList["marshalled_acl"] = "marshalled_acl";
    QueuedSubscriptionRequestWatchList["gql_query_string"] = "gql_query_string";
    QueuedSubscriptionRequestWatchList["query_attributes"] = "query_attributes";
    QueuedSubscriptionRequestWatchList["operation_name"] = "operation_name";
    QueuedSubscriptionRequestWatchList["publish_to_topic_name"] = "publish_to_topic_name";
    QueuedSubscriptionRequestWatchList["client_request_uuid"] = "client_request_uuid";
    QueuedSubscriptionRequestWatchList["active"] = "active";
    QueuedSubscriptionRequestWatchList["updated_at"] = "updated_at";
    QueuedSubscriptionRequestWatchList["deleted_at"] = "deleted_at";
})(QueuedSubscriptionRequestWatchList || (QueuedSubscriptionRequestWatchList = {}));
type_graphql_1.registerEnumType(QueuedSubscriptionRequestWatchList, {
    name: 'QueuedSubscriptionRequestWatchList',
    description: `The list of properties that can be watched for change in QueuedSubscriptionRequests`
});
/**
 * Filters for Subscriptions dont require OrderBy or Pagination. But they can use
 * Timestamps and a specialized SubscriptonFilter that watches for changes in attributes
 */
let QueuedSubscriptionRequestFilterForSubscriptions = class QueuedSubscriptionRequestFilterForSubscriptions extends with_subscription_filter_mixin_1.withSubscriptionFilter(__1.withTimeStampsFilter(ConcreteQueuedSubscriptionRequestFilter), QueuedSubscriptionRequestWatchList) {
};
QueuedSubscriptionRequestFilterForSubscriptions = __decorate([
    type_graphql_1.ArgsType()
], QueuedSubscriptionRequestFilterForSubscriptions);
exports.QueuedSubscriptionRequestFilterForSubscriptions = QueuedSubscriptionRequestFilterForSubscriptions;
//# sourceMappingURL=queued_subscription_request.relay.js.map