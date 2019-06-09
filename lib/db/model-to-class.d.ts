import { Model } from 'sequelize-typescript';
import { NodeService } from '../gql/relay.service';
import { Node } from '../gql/index';
import { ClassType } from '../helpers/classtype';
export declare const modelKey: unique symbol;
export declare const apiKey: unique symbol;
/**
 * Defines a simple interface to create a concrete class from a discriminator
 * These should be added to 'NodeServices' on the context as well... and use the base classes
 * service implementation
 */
export declare class GqlSingleTableInheritanceFactory<TEnum, TGql extends Node<TGql>, TDb extends Model<TDb>> {
    private nodeService;
    private discriminatorKey;
    private concreteClassMap;
    constructor(nodeService: NodeService<TGql>, discriminatorKey: string, concreteClassMap: Map<keyof TEnum, ClassType<TGql>>);
    makeFrom(from: TDb): TGql;
}
export declare function modelToClass<T extends Node<T>, V extends Model<V>>(nodeService: NodeService<T>, to: ClassType<T>, from: V): T;
export declare function reloadNodeFromModel<T extends Node<T>>(node: T, fromDb?: boolean): Promise<T>;
