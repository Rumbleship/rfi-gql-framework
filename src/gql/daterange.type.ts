import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { plainToClass } from 'class-transformer';

export class DateRange {
  from?: Date;
  to?: Date;
}

export const DateRangeGQL = new GraphQLScalarType({
  name: 'DateRange',
  description: ' Defines a date range to filter "{from:String, to:String}"',
  parseValue(value: string) {
    return plainToClass(DateRange, JSON.parse(value)); // value from the client input variables
  },
  serialize(value: DateRange) {
    return JSON.stringify(value); // sent to client
  },
  parseLiteral(ast: ValueNode, variables) {
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        if (field.value.kind === 'StringValue') {
          value[field.name.value] = new Date(field.value.value);
        }
      });
      return plainToClass(DateRange, value); // value from the client query
    }
    return null;
  }
});
