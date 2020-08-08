"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFilterableId = exports.FilterableId = exports.FilterableIdSymbol = void 0;
exports.FilterableIdSymbol = Symbol('FilterableIdSymbol');
function FilterableId(options = {}) {
    return (target_class, property_name) => {
        var _a;
        const list = (_a = Reflect.getMetadata(exports.FilterableIdSymbol, target_class)) !== null && _a !== void 0 ? _a : [];
        list.push(property_name);
        Reflect.defineMetadata(exports.FilterableIdSymbol, list, target_class);
    };
}
exports.FilterableId = FilterableId;
function isFilterableId(filter, property_name) {
    var _a;
    const list = (_a = Reflect.getMetadata(exports.FilterableIdSymbol, filter)) !== null && _a !== void 0 ? _a : [];
    if (list.includes(property_name)) {
        return true;
    }
    return false;
}
exports.isFilterableId = isFilterableId;
//# sourceMappingURL=filterable-id.decorator.js.map