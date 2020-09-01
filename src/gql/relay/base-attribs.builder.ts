import { InputType, ObjectType, ArgsType, InterfaceType } from 'type-graphql';
import { AttribType } from './attrib.enum';

// tslint:disable-next-line: ban-types
export function GqlBaseAttribs(attribType: AttribType): ClassDecorator {
  // tslint:disable-next-line: only-arrow-functions
  return function (target: Record<string, any>): any {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const clazz: Function = target as Function;
    switch (attribType) {
      case AttribType.Input:
      case AttribType.Update:
        return InputType({ isAbstract: true })(clazz);
      case AttribType.Obj:
        return ObjectType({ isAbstract: true })(clazz);
      case AttribType.Arg:
        return ArgsType()(clazz);
      case AttribType.Interface:
        return InterfaceType({ isAbstract: true })(clazz);
    }
    return clazz;
  };
}

export function isInputOrObject(attribType: AttribType): boolean {
  return (
    attribType === AttribType.Input ||
    attribType === AttribType.Obj ||
    attribType === AttribType.Interface
  );
}

// name to base-attribs.ts
