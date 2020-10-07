"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayOrderByGQL = exports.RelayOrderBy = void 0;
const graphql_1 = require("graphql");
const class_transformer_1 = require("class-transformer");
class RelayOrderBy {
}
exports.RelayOrderBy = RelayOrderBy;
exports.RelayOrderByGQL = new graphql_1.GraphQLScalarType({
    name: 'OrderBy',
    description: 'Specify the sorting order query should return: { "keys": [["attrib1", "DESC"], ["attrib2", "ASC"]] } where attribn is the name of an attribute in the returned Object',
    parseValue(value) {
        return class_transformer_1.deserialize(RelayOrderBy, value); // value from the client input variables
    },
    serialize(value) {
        return class_transformer_1.serialize(value); // sent to client
    },
    parseLiteral(ast, variables) {
        if (ast.kind === graphql_1.Kind.OBJECT) {
            // this is ugly and needs to be unwrapped from the ast....
            // we pick out what we are given the things we know
            const value = Object.create(null);
            ast.fields.forEach(field => {
                switch (field.name.value) {
                    case 'keys': {
                        if (field.value.kind === graphql_1.Kind.LIST) {
                            value['keys'] = field.value.values.map(valueNode => {
                                if (valueNode.kind === graphql_1.Kind.LIST) {
                                    return valueNode.values.map(entry => {
                                        if (entry.kind === graphql_1.Kind.STRING) {
                                            return entry.value;
                                        }
                                        else {
                                            return '';
                                        }
                                    });
                                }
                                else {
                                    return [];
                                }
                            });
                        }
                    }
                }
            });
            return class_transformer_1.plainToClass(RelayOrderBy, value); // value from the client query
        }
        return null;
    }
});
//# sourceMappingURL=relay-order-by.scalar.js.map