import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { plainToClass, serialize, deserialize } from 'class-transformer';

export type OrderByDirection = 'ASC' | 'DESC';

export class RelayOrderBy<T> {
  keys?: Array<[keyof T, OrderByDirection]>;
}

export const RelayOrderByGQL = new GraphQLScalarType({
  name: 'OrderBy',
  description:
    'Specify the sorting order query should return: { "keys": [["attrib1", "DESC"], ["attrib2", "ASC"]] } where attribn is the name of an attribute in the returned Object',
  parseValue(value: string) {
    return deserialize(RelayOrderBy, value); // value from the client input variables
  },
  serialize(value: RelayOrderBy<any>) {
    return serialize(value); // sent to client
  },
  parseLiteral(ast: ValueNode, variables) {
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        if (field.value.kind === 'StringValue') {
          value[field.name.value] = field.value.value;
        }
      });
      return plainToClass(RelayOrderBy, value); // value from the client query
    }
    return null;
  }
});
