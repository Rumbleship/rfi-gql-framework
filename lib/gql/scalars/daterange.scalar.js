"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRangeGQL = exports.DateRange = void 0;
const graphql_1 = require("graphql");
const class_transformer_1 = require("class-transformer");
class DateRange {
}
exports.DateRange = DateRange;
exports.DateRangeGQL = new graphql_1.GraphQLScalarType({
    name: 'DateRange',
    description: ' Defines a date range to filter: {from:String, to:String}',
    parseValue(value) {
        return class_transformer_1.plainToClass(DateRange, JSON.parse(value)); // value from the client input variables
    },
    serialize(value) {
        return JSON.stringify(value); // sent to client
    },
    parseLiteral(ast, variables) {
        if (ast.kind === graphql_1.Kind.OBJECT) {
            const value = Object.create(null);
            ast.fields.forEach(field => {
                if (field.value.kind === 'StringValue') {
                    value[field.name.value] = new Date(field.value.value);
                }
                if (field.value.kind === 'Variable' && variables) {
                    value[field.name.value] = Reflect.get(variables, field.name.value);
                }
            });
            return class_transformer_1.plainToClass(DateRange, value); // value from the client query
        }
        return null;
    }
});
//# sourceMappingURL=daterange.scalar.js.map