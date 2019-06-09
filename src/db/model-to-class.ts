import { Model } from 'sequelize-typescript';
import { NodeService } from '../gql/relay.service';
import { Node, Oid } from '../gql/index';
import { ClassType } from '../helpers/classtype';

export const modelKey = Symbol.for('model');
export const apiKey = Symbol.for('api');

/**
 * Defines a simple interface to create a concrete class from a discriminator
 * These should be added to 'NodeServices' on the context as well... and use the base classes
 * service implementation
 */
export class GqlSingleTableInheritanceFactory<
  TEnum,
  TGql extends Node<TGql>,
  TDb extends Model<TDb>
> {
  constructor(
    private nodeService: NodeService<TGql>,
    private discriminatorKey: string,
    private concreteClassMap: Map<keyof TEnum, ClassType<TGql>>
  ) {}
  makeFrom(from: TDb): TGql {
    const discriminator = Reflect.get(from, this.discriminatorKey);
    if (discriminator) {
      const concreteClass = this.concreteClassMap.get(discriminator);
      if (concreteClass) {
        return modelToClass(this.nodeService, concreteClass, from);
      }
    }
    throw Error(`couldnt find concrete class for: ${discriminator}`);
  }
}

// Creates a new Object of type T and fills it with the plain proerties of the Sequelize Model
// It is a SHALLOW copy...

export function modelToClass<T extends Node<T>, V extends Model<V>>(
  nodeService: NodeService<T>,
  to: ClassType<T>,
  from: V
): T {
  const modelAsPlain: any = from.get({ plain: true });
  // Have we already done this transforation?
  if (apiKey in from) {
    return Reflect.get(from, apiKey);
  }
  const obj: T = Object.assign(new to(), modelAsPlain);
  const oid = Oid.create(
    obj.constructor['name'],
    modelAsPlain.uuid ? modelAsPlain.uuid : String(modelAsPlain.id)
  );
  obj.id = oid;
  obj._service = nodeService;
  // store for future use
  Reflect.set(obj, modelKey, from);
  Reflect.set(from, apiKey, obj);
  return obj;
}

export async function reloadNodeFromModel<T extends Node<T>>(node: T, fromDb = true): Promise<T> {
  if (modelKey in node) {
    const model = Reflect.get(node, apiKey) as Model<any>;
    if (fromDb) {
      await model.reload();
    }
    const modelAsPlain: any = model.get({ plain: true });
    delete modelAsPlain.id;
    Object.assign(node, modelAsPlain);
  }
  return node;
}
