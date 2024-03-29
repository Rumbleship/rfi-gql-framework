import { Model } from 'sequelize-typescript';
import { Oid } from '@rumbleship/oid';
import { Node, NodeService } from '../../gql';
import { ClassType } from '../../helpers';
import { setAuthorizeContext } from './create-auth-where-clause';
import { apiKey, modelKey } from './db-to-gql.symbol';

/**
 * Defines a simple interface to create a concrete class from a discriminator
 * These should be added to 'NodeServices' on the context as well... and use the base classes
 * service implementation
 *
 * Note that the base class is used for the 'scope' of the oid.
 */
export class GqlSingleTableInheritanceFactory<
  TEnum,
  TGql extends Node<TGql>,
  TDb extends Model<TDb>
> {
  constructor(
    private oidScope: string, // the scope is the base class scope.
    private discriminatorKey: string,
    private concreteClassMap: Map<keyof TEnum, () => ClassType<TGql>>
  ) {}
  makeFrom(from: TDb, nodeService: NodeService<TGql>): TGql {
    const discriminator = Reflect.get(from, this.discriminatorKey);
    if (discriminator) {
      const concreteClass = this.concreteClassMap.get(discriminator);
      if (concreteClass) {
        return dbToGql(nodeService, concreteClass(), from, this.oidScope);
      }
    }
    throw Error(`couldnt find concrete class for: ${discriminator}`);
  }
  getClassFor(discriminator: keyof TEnum): undefined | (() => ClassType<TGql>) {
    return this.concreteClassMap.get(discriminator);
  }
  getClasses(): ClassType<TGql>[] {
    return [...this.concreteClassMap.values()].map((concreteFn: () => ClassType<TGql>) =>
      concreteFn()
    );
  }
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
export function dbToGql<T extends Node<T>, V extends Model<V>>(
  nodeService: NodeService<T>,
  to: ClassType<T>,
  from: V,
  oidScope?: string
): T {
  const modelAsPlain: any = from.get(/*{ plain: true }*/);

  // Have we already done this transforation?
  if (apiKey in from) {
    return Reflect.get(from, apiKey);
  }
  const target = new to();
  target._service = nodeService;
  // tslint:disable-next-line: prefer-object-spread
  const obj = Object.assign(target, modelAsPlain);
  const oid = Oid.Create(oidScope ? oidScope : obj.constructor['name'], modelAsPlain.id);
  obj.id = oid;
  // store for future use
  Reflect.set(obj, modelKey, from);
  Reflect.set(from, apiKey, obj);
  return obj;
}

export async function reloadNodeFromModel<T extends Node<T>>(node: T, fromDb = true): Promise<T> {
  if (modelKey in node) {
    const model = Reflect.get(node, modelKey) as Model<any>;
    if (fromDb) {
      // We know we are auth'd at this point, so simply add an blank auth context so the sequelize Find methods will
      // know that we have explicitly considered authorization
      const reloadOpts = setAuthorizeContext({}, { authApplied: true });
      await model.reload(reloadOpts);
    }
    const modelAsPlain: any = model.get({ plain: true, clone: true });
    delete modelAsPlain.id;
    Object.assign(node, modelAsPlain);
  }
  return node;
}

export function gqlToDb<T extends Node<T>, V extends Model<V>>(node: T): V {
  if (modelKey in node) {
    return Reflect.get(node, modelKey) as V;
  }
  throw new Error(`Node: ${JSON.stringify(node)} doesn't have an associated Sequelize Model`);
}
