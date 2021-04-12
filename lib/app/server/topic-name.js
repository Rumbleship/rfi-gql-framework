"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerName = void 0;
const notification_of_enum_1 = require("../../gql/relay/notification-of.enum");
function triggerName(publisher_version, scope, prefix) {
    var _a;
    if (publisher_version === void 0) { publisher_version = (_a = process.env.GAE_VERSION) !== null && _a !== void 0 ? _a : 'date-version-branch'; }
    const elements = [notification_of_enum_1.NODE_CHANGE_NOTIFICATION];
    if (prefix) {
        elements.unshift(prefix);
    }
    if (scope) {
        elements.push(scope);
    }
    elements.push(publisher_version);
    return elements.join('_');
}
exports.triggerName = triggerName;
//# sourceMappingURL=topic-name.js.map