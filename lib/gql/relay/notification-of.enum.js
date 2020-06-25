"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_CHANGE_NOTIFICATION = exports.NotificationOf = void 0;
const type_graphql_1 = require("type-graphql");
var NotificationOf;
(function (NotificationOf) {
    NotificationOf["LAST_KNOWN_STATE"] = "LAST_KNOWN_STATE";
    NotificationOf["CREATED"] = "CREATED";
    NotificationOf["UPDATED"] = "UPDATED";
})(NotificationOf = exports.NotificationOf || (exports.NotificationOf = {}));
type_graphql_1.registerEnumType(NotificationOf, {
    name: 'NotificationOf',
    description: `For PubSub: The type of Notification. Note that BULK_CHANGE is sent when multiple 
  updates creates or destroys have been detected and the server can't be sure what they were EG if a
  complex bulk create or update was executed by the server,and the client should generally refresh all models 
  they are interested in.
  `
});
exports.NODE_CHANGE_NOTIFICATION = 'NODE_CHANGE_NOTIFICATION';
//# sourceMappingURL=notification-of.enum.js.map