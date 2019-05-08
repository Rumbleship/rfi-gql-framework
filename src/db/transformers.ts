import { Model, DataType } from 'sequelize-typescript';
import { NodeService } from '../gql/relay.service';
import { Node, Oid } from '../gql/index';
import { ClassType } from 'type-graphql';
import { enumAsStrings } from '../helpers/enumAsStrings';

// Creates a new Object of type T and fills it with the plain proerties of the Sequelize Model
// It is a SHALLOW copy...

export const modelKey = Symbol.for('model');
export const apiKey = Symbol.for('api');
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

export function convertToSequelizeEnum<TEnum>(toConvert: TEnum, options?: { exclude: string[] }) {
  let enumValues = enumAsStrings(toConvert);
  if (options) {
    enumValues = enumValues.filter((value: string) => {
      return !options.exclude.includes(value);
    });
  }
  return DataType.ENUM(...enumValues);
}
