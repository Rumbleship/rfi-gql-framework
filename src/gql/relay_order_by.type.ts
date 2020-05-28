import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { plainToClass, serialize, deserialize } from 'class-transformer';

export class RelayOrderBy<T> {
  keys?: Array<[keyof T, 'ASC' | 'DESC']>;
}

export const RelayOrderByGQL = new GraphQLScalarType({
  name: 'DateRange',
  description: ' Defines a date range to filter: {from:String, to:String}',
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
