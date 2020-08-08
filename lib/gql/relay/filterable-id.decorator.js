"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFilterableId = exports.FilterableId = exports.FilterableIdSymbol = void 0;
exports.FilterableIdSymbol = Symbol('FilterableIdSymbol');
function FilterableId(options = {}) {
    return (target_class, property_name) => {
        Reflect.defineMetadata(exports.FilterableIdSymbol, true, target_class, property_name);
    };
}
exports.FilterableId = FilterableId;
function isFilterableId(filter, property_name) {
    if (Reflect.hasMetadata(exports.FilterableIdSymbol, filter, property_name)) {
        return true;
    }
    return false;
}
exports.isFilterableId = isFilterableId;
//# sourceMappingURL=filterable-id.decorator.js.map