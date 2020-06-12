"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function enumAsStrings(toConvert) {
    const strings = [];
    for (const txnType in toConvert) {
        if (toConvert.hasOwnProperty(txnType)) {
            strings.push(Reflect.get(toConvert, txnType));
        }
    }
    return strings;
}
exports.enumAsStrings = enumAsStrings;
//# sourceMappingURL=enum-as-srings.js.map