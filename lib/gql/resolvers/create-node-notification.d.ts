import { ClassType } from '../../helpers';
import { BaseReadableResolverInterface } from './base-resolver.interface';
import { Node, NodeNotification } from '../relay';
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function createNodeNotification<TApi extends Node<TApi> = any>(raw: RawPayload, resolver: BaseReadableResolverInterface<TApi, any, any>, NotificationType: ClassType<NodeNotification<TApi>>): Promise<NodeNotification<TApi>>;
