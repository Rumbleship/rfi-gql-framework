import { ClassType } from './../../helpers/';
import { Node } from './relay.interface';
import { NodeNotification } from './node-notification';
export declare function GqlNodeNotification<T extends Node<T>>(clsNotification: ClassType<T>): ClassType<NodeNotification<T>>;
