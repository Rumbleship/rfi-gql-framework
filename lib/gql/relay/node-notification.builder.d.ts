import { ClassType } from './../../helpers/';
import { Node } from './relay.interface';
import { ModelDeltaClass, NodeNotification } from './node-notification';
export declare class GqlModelDelta extends ModelDeltaClass {
    key: string;
    previousValue: string;
    newValue: string;
}
export declare function GqlNodeNotification<T extends Node<T>>(clsNotification: ClassType<T>): ClassType<NodeNotification<T>>;
