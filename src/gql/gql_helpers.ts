import { AttribType } from '../scalars/index';
import { InputType, ObjectType, ArgsType } from 'type-graphql';

// tslint:disable-next-line: ban-types
export function GqlBaseAttribs(attribType: AttribType): ClassDecorator {
  // tslint:disable-next-line: only-arrow-functions
  return function(target: object): any {
    // tslint:disable-next-line: ban-types
    const clazz: Function = target as Function;
    switch (attribType) {
      case AttribType.Input:
      case AttribType.Update:
        return InputType({ isAbstract: true })(clazz);
      case AttribType.Obj:
        return ObjectType({ isAbstract: true })(clazz);
      case AttribType.Arg:
        return ArgsType()(clazz);
    }
    return clazz;
  };
}

export function isInputOrObject(attribType: AttribType): boolean {
  return attribType === AttribType.Input || attribType === AttribType.Obj;
}
