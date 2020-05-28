import { GraphQLScalarType } from 'graphql';
export declare class RelayOrderBy<T> {
    keys?: Array<[keyof T, 'ASC' | 'DESC']>;
}
export declare const RelayOrderByGQL: GraphQLScalarType;
