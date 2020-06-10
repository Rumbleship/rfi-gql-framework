import { Oid } from '@rumbleship/oid';
import { NodeNotification, Node } from '../gql';
import { ClassType } from './../helpers/classtype';
export interface RfiSubscriptionOptions {
    asService?: boolean;
    serviceName?: string;
}
export declare function uniqueSubscriptionNamePart(topicName: string, subscriptionOptions?: RfiSubscriptionOptions): string;
interface OIDPayloadCreator {
    getOne(id: Oid): Promise<any>;
}
interface StrPayloadCreator {
    getOne(id: string): Promise<any>;
}
export interface PayloadCreator {
    getOne(id: Oid | string): Promise<Node<any>>;
}
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function createPayload(raw: RawPayload, resolver: PayloadCreator, notification_cls_type: ClassType<any>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingStr(rawPayload: RawPayload, resolver: StrPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingOid(rawPayload: RawPayload, resolver: OIDPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export {};
