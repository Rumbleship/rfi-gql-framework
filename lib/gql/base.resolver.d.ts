import { Node, Connection } from './index';
import { ClassType } from '../helpers/classtype';
export declare function createBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate>(baseName: string, objectTypeCls: ClassType<TApi>, connectionTypeCls: ClassType<TConnection>, filterClsType: ClassType<TFilter>, inputClsType: ClassType<TInput>, updateClsType: ClassType<TUpdate>): any;
