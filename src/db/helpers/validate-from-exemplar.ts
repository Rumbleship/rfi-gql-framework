import { Model } from 'sequelize-typescript';
import { validateSync, ValidationError } from 'class-validator';
import { ClassType } from '../../helpers';

export function validateFromExemplar<V extends Model<V>, T>(toValidate: V, exemplar: ClassType<T>) {
  const modelAsPlain = toValidate.get({ plain: true });
  const exemplarInstance: T = Object.assign(new exemplar(), modelAsPlain);
  // NOTE any asynchronous validations will Be ignored...
  const errors = validateSync(exemplarInstance, {
    skipMissingProperties: true
  });
  if (errors.length) {
    const res = errors.reduce<string>((str: string, error: ValidationError) => {
      return str + '\n' + error.toString();
    }, '');
    throw Error(res);
  }
}
