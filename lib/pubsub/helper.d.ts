import { Oid } from '@rumbleship/oid';
import { NodeNotification } from '../gql';
import { ClassType } from './../helpers/classtype';
import { BaseReadableResolverInterface } from '../gql/base-resolver.interface';
export interface RfiSubscriptionOptions {
    asService?: boolean;
    serviceName?: string;
}
export declare function uniqueSubscriptionNamePart(topicName: string, subscriptionOptions?: RfiSubscriptionOptions): string;
/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface OIDPayloadCreator {
    getOne(id: Oid): Promise<any>;
}
/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface StrPayloadCreator {
    getOne(id: string): Promise<any>;
}
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function createPayload(raw: RawPayload, invoker: BaseReadableResolverInterface<any, any, any>, NotificationType: ClassType<NodeNotification<any>>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingStr(rawPayload: RawPayload, resolver: StrPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingOid(rawPayload: RawPayload, resolver: OIDPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export {};
