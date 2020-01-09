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
 *
 * Note that the base class is used for the 'scope' of the oid.
 */
export declare class GqlSingleTableInheritanceFactory<TEnum, TGql extends Node<TGql>, TDb extends Model<TDb>> {
    private oidScope;
    private discriminatorKey;
    private concreteClassMap;
    constructor(oidScope: string, // the scope is the base class scope.
    discriminatorKey: string, concreteClassMap: Map<keyof TEnum, ClassType<TGql>>);
    makeFrom(from: TDb, nodeService: NodeService<TGql>): TGql;
    getClassFor(discriminator: keyof TEnum): ClassType<TGql> | undefined;
    getClasses(): ClassType<TGql>[];
}
/**
 * @deprecated for direct use. Use SequelizeBaseServiceInterface.gqlFromDbModel
 * instead.
 *
 * Transforms from a sequelize model to a gql object
 * THis does not take into account any polymorthic discriminators
 * and so should not be used directly.
 *
 * @param nodeService
 * @param to
 * @param from
 * @param oidScope
 */
export declare function dbToGql<T extends Node<T>, V extends Model<V>>(nodeService: NodeService<T>, to: ClassType<T>, from: V, oidScope?: string): T;
export declare function reloadNodeFromModel<T extends Node<T>>(node: T, fromDb?: boolean): Promise<T>;
