import { Model } from 'sequelize-typescript';
import { Node, NodeService } from '../../gql';
import { ClassType } from '../../helpers';
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
    discriminatorKey: string, concreteClassMap: Map<keyof TEnum, () => ClassType<TGql>>);
    makeFrom(from: TDb, nodeService: NodeService<TGql>): TGql;
    getClassFor(discriminator: keyof TEnum): undefined | (() => ClassType<TGql>);
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
 * Note that if any models are eager loaded, they ARE not converted, so the Relay/gql object
 * references the sequelize model of that name... higher level functions should deal with that
 * by checkingthe instanceOf the associated model and converting at that time as required.
 *
 * @param nodeService
 * @param to
 * @param from
 * @param oidScope
 */
export declare function dbToGql<T extends Node<T>, V extends Model<V>>(nodeService: NodeService<T>, to: ClassType<T>, from: V, oidScope?: string): T;
export declare function reloadNodeFromModel<T extends Node<T>>(node: T, fromDb?: boolean): Promise<T>;
export declare function gqlToDb<T extends Node<T>, V extends Model<V>>(node: T): V;
