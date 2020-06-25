import { GraphQLScalarType } from 'graphql';
export declare type OrderByDirection = 'ASC' | 'DESC';
export declare class RelayOrderBy<T> {
    keys?: Array<[keyof T, OrderByDirection]>;
}
export declare const RelayOrderByGQL: GraphQLScalarType;
